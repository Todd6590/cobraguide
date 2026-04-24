import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, affiliate_id } = await req.json();

    // Find the affiliate record for this user
    const affiliates = await base44.asServiceRole.entities.Affiliate.filter({ user_email: user.email });
    const affiliate = affiliates[0];

    if (!affiliate) {
      return Response.json({ error: 'No affiliate record found' }, { status: 404 });
    }

    // CREATE: Create a new Stripe Connect Express account if none exists
    if (action === 'create_account' || !affiliate.stripe_account_id) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: affiliate.email,
        capabilities: {
          transfers: { requested: true },
        },
        metadata: {
          affiliate_id: affiliate.id,
          user_email: user.email,
        },
      });

      await base44.asServiceRole.entities.Affiliate.update(affiliate.id, {
        stripe_account_id: account.id,
        payout_method: 'stripe_connect',
      });

      console.log(`Created Stripe Connect account ${account.id} for ${user.email}`);

      // Create onboarding link
      const origin = req.headers.get('origin') || 'https://app.cobrashieldpro.com';
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${origin}/affiliate-program?connect=refresh`,
        return_url: `${origin}/affiliate-program?connect=success`,
        type: 'account_onboarding',
      });

      return Response.json({ url: accountLink.url, account_id: account.id });
    }

    // REFRESH: Re-generate onboarding link for an existing account
    if (action === 'refresh_link') {
      const origin = req.headers.get('origin') || 'https://app.cobrashieldpro.com';
      const accountLink = await stripe.accountLinks.create({
        account: affiliate.stripe_account_id,
        refresh_url: `${origin}/affiliate-program?connect=refresh`,
        return_url: `${origin}/affiliate-program?connect=success`,
        type: 'account_onboarding',
      });
      return Response.json({ url: accountLink.url });
    }

    // CHECK: Check onboarding status
    if (action === 'check_status') {
      const account = await stripe.accounts.retrieve(affiliate.stripe_account_id);
      const complete = account.details_submitted && account.charges_enabled;

      if (complete && !affiliate.stripe_onboarding_complete) {
        await base44.asServiceRole.entities.Affiliate.update(affiliate.id, {
          stripe_onboarding_complete: true,
        });
      }

      return Response.json({
        complete,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('stripeConnectOnboard error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});