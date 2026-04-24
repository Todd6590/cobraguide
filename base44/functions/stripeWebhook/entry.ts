import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const PLAN_LIMITS = {
  starter:      { clientLimit: 5,  beneficiaryLimit: 0 },
  professional: { clientLimit: 25, beneficiaryLimit: 0 },
  agency:       { clientLimit: 0,  beneficiaryLimit: 0 },
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, Deno.env.get('STRIPE_WEBHOOK_SECRET'));
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response('Webhook Error', { status: 400 });
  }

  try {
    const base44 = createClientFromRequest(req);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userEmail = session.metadata?.user_email;
      const tier = session.metadata?.plan_tier;
      const isStudyGroup = session.metadata?.is_study_group_promo === 'true';

      if (userEmail && tier && PLAN_LIMITS[tier]) {
        const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ user_email: userEmail });
        const limits = PLAN_LIMITS[tier];

        const trialStart = new Date();
        const trialEnd = new Date(trialStart);
        trialEnd.setDate(trialEnd.getDate() + 7);
        const fmtDate = (d) => d.toISOString().split('T')[0];

        const updateData = {
          plan_tier: tier,
          client_limit: limits.clientLimit,
          stripe_subscription_id: session.subscription,
          ...(isStudyGroup ? {
            is_study_group: true,
            study_group_trial_start: fmtDate(trialStart),
            study_group_trial_end: fmtDate(trialEnd),
            study_group_expired: false,
            day6_email_sent: false,
          } : {}),
        };

        if (plans.length > 0) {
          await base44.asServiceRole.entities.SubscriptionPlan.update(plans[0].id, updateData);
        } else {
          await base44.asServiceRole.entities.SubscriptionPlan.create({ user_email: userEmail, ...updateData });
        }
        console.log(`Upgraded ${userEmail} to ${tier}${isStudyGroup ? ' (StudyGroup trial)' : ''}`);

        // Handle affiliate conversion — record commission
        const referralCode = session.metadata?.referral_code;
        if (referralCode) {
          const referrals = await base44.asServiceRole.entities.Referral.filter({ referral_code: referralCode, referred_email: userEmail });
          for (const referral of referrals) {
            if (referral.status !== 'converted') {
              // Determine subscription amount from Stripe
              let subscriptionAmount = 0;
              if (session.subscription) {
                const sub = await stripe.subscriptions.retrieve(session.subscription);
                subscriptionAmount = (sub.items.data[0]?.price?.unit_amount || 0) / 100;
              }
              const commissionRate = 0.20;
              const commissionAmount = parseFloat((subscriptionAmount * commissionRate).toFixed(2));

              await base44.asServiceRole.entities.Referral.update(referral.id, {
                status: 'converted',
                converted_date: new Date().toISOString().split('T')[0],
                plan_tier: tier,
                subscription_amount: subscriptionAmount,
                commission_rate: commissionRate,
                commission_amount: commissionAmount,
                total_commission_earned: commissionAmount,
                commission_status: 'pending',
                last_invoice_date: new Date().toISOString().split('T')[0],
              });
              console.log(`Affiliate commission recorded: $${commissionAmount} for ${referral.referrer_email} (referred ${userEmail})`);
            }
          }
        }
      }
    }

    // Track recurring commissions on every paid invoice + auto-transfer via Stripe Connect
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      // Skip $0 invoices; handle both first and recurring payments
      if (invoice.amount_paid > 0) {
        const customerEmail = invoice.customer_email;
        if (customerEmail) {
          // Find any converted referral for this customer
          const referrals = await base44.asServiceRole.entities.Referral.filter({ referred_email: customerEmail, status: 'converted' });
          for (const referral of referrals) {
            const invoiceAmount = invoice.amount_paid / 100;
            const commissionRate = referral.commission_rate || 0.20;
            const newCommission = parseFloat((invoiceAmount * commissionRate).toFixed(2));
            const newTotal = parseFloat(((referral.total_commission_earned || 0) + newCommission).toFixed(2));

            // Look up the affiliate's Stripe Connect account
            const affiliates = await base44.asServiceRole.entities.Affiliate.filter({ user_email: referral.referrer_email });
            const affiliate = affiliates[0] || null;
            // Also check by email field
            const affiliatesByEmail = affiliate ? [] : await base44.asServiceRole.entities.Affiliate.filter({ email: referral.referrer_email });
            const resolvedAffiliate = affiliate || affiliatesByEmail[0] || null;

            let transferId = null;
            if (resolvedAffiliate?.stripe_account_id && resolvedAffiliate?.stripe_onboarding_complete) {
              // Auto-transfer commission to affiliate's Stripe Connect account
              const commissionCents = Math.round(newCommission * 100);
              try {
                const transfer = await stripe.transfers.create({
                  amount: commissionCents,
                  currency: 'usd',
                  destination: resolvedAffiliate.stripe_account_id,
                  description: `Commission for referring ${customerEmail}`,
                  metadata: {
                    referral_id: referral.id,
                    referrer_email: referral.referrer_email,
                    referred_email: customerEmail,
                    invoice_id: invoice.id,
                  },
                });
                transferId = transfer.id;
                console.log(`Auto-transferred $${newCommission} to ${resolvedAffiliate.stripe_account_id} (transfer: ${transfer.id})`);
              } catch (transferErr) {
                console.error(`Transfer failed for ${referral.referrer_email}:`, transferErr.message);
              }
            } else {
              console.log(`No Stripe Connect account for ${referral.referrer_email} — commission tracked but not transferred`);
            }

            await base44.asServiceRole.entities.Referral.update(referral.id, {
              total_commission_earned: newTotal,
              last_invoice_date: new Date().toISOString().split('T')[0],
              commission_status: transferId ? 'paid' : (referral.commission_status || 'pending'),
              ...(transferId ? { payout_reference: transferId, payout_date: new Date().toISOString().split('T')[0] } : {}),
            });
            console.log(`Commission: +$${newCommission} for ${referral.referrer_email} (total: $${newTotal})${transferId ? ' [AUTO-PAID]' : ' [PENDING]'}`);
          }
        }
      }
    }

    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      // If a StudyGroup trial ended without payment method, mark as expired
      if (subscription.status === 'canceled' || (subscription.status === 'past_due' && subscription.trial_end)) {
        const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ stripe_subscription_id: subscription.id });
        for (const p of plans) {
          if (p.is_study_group) {
            await base44.asServiceRole.entities.SubscriptionPlan.update(p.id, {
              plan_tier: 'trial',
              study_group_expired: true,
            });
            console.log(`StudyGroup trial expired for ${p.user_email}`);
          }
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});