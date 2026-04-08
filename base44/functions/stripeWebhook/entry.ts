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

      if (userEmail && tier && PLAN_LIMITS[tier]) {
        const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ user_email: userEmail });
        const limits = PLAN_LIMITS[tier];

        if (plans.length > 0) {
          await base44.asServiceRole.entities.SubscriptionPlan.update(plans[0].id, {
            plan_tier: tier,
            client_limit: limits.clientLimit,
            stripe_subscription_id: session.subscription,
          });
        } else {
          await base44.asServiceRole.entities.SubscriptionPlan.create({
            user_email: userEmail,
            plan_tier: tier,
            client_limit: limits.clientLimit,
            stripe_subscription_id: session.subscription,
          });
        }
        console.log(`Upgraded ${userEmail} to ${tier}`);

        // Handle referral conversion reward
        const referralCode = session.metadata?.referral_code;
        if (referralCode) {
          // Find open referral for this email + code
          const referrals = await base44.asServiceRole.entities.Referral.filter({ referral_code: referralCode, referred_email: userEmail });
          for (const referral of referrals) {
            if (referral.status !== 'converted') {
              await base44.asServiceRole.entities.Referral.update(referral.id, {
                status: 'converted',
                converted_date: new Date().toISOString().split('T')[0],
              });

              // Apply 1 free month coupon to the referrer
              const referrerEmail = referral.referrer_email;
              const customers = await stripe.customers.list({ email: referrerEmail, limit: 1 });
              if (customers.data.length > 0) {
                const coupon = await stripe.coupons.create({
                  duration: 'once',
                  percent_off: 100,
                  name: 'Referral Reward - 1 Free Month',
                  metadata: { referral_id: referral.id, referrer_email: referrerEmail }
                });
                await stripe.customers.update(customers.data[0].id, { coupon: coupon.id });
                await base44.asServiceRole.entities.Referral.update(referral.id, {
                  reward_applied: true,
                  stripe_coupon_id: coupon.id,
                });
                console.log(`Referral reward applied: coupon ${coupon.id} → ${referrerEmail}`);
              }
            }
          }
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      // Find plan by subscription ID and downgrade to trial
      console.log('Subscription cancelled:', subscription.id);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});