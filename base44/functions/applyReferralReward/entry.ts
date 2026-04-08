import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { referral_id } = await req.json();
    if (!referral_id) return Response.json({ error: 'referral_id required' }, { status: 400 });

    // Only admins can apply rewards (called from stripe webhook handler via service role)
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const referrals = await base44.asServiceRole.entities.Referral.filter({ id: referral_id });
    const referral = referrals[0];
    if (!referral) return Response.json({ error: 'Referral not found' }, { status: 404 });
    if (referral.reward_applied) return Response.json({ message: 'Reward already applied' });

    // Find the referrer's Stripe customer
    const customers = await stripe.customers.list({ email: referral.referrer_email, limit: 1 });
    if (customers.data.length === 0) {
      return Response.json({ error: 'Referrer has no Stripe customer record' }, { status: 404 });
    }
    const customer = customers.data[0];

    // Create a one-month free coupon
    const coupon = await stripe.coupons.create({
      duration: 'once',
      percent_off: 100,
      name: 'Referral Reward - 1 Free Month',
      metadata: { referral_id, referrer_email: referral.referrer_email }
    });

    // Apply coupon to customer
    await stripe.customers.update(customer.id, {
      coupon: coupon.id
    });

    // Mark reward applied
    await base44.asServiceRole.entities.Referral.update(referral_id, {
      reward_applied: true,
      stripe_coupon_id: coupon.id
    });

    console.log(`Reward applied: referral ${referral_id}, coupon ${coupon.id} → ${referral.referrer_email}`);
    return Response.json({ success: true, coupon_id: coupon.id });

  } catch (error) {
    console.error('applyReferralReward error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});