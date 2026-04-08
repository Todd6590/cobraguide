import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const PRICE_IDS = {
  starter:      'price_1TJjEuQGEvsOY1m3h9HvKCvU',
  professional: 'price_1TJjEuQGEvsOY1m3MFZjGvTm',
  agency:       'price_1TJjEuQGEvsOY1m3p6IoDSdK',
};

// Discount codes that grant 100% off Agency tier (unlimited access)
// Add new codes here as needed
const DISCOUNT_CODES = {
  'beardown2026': { tier: 'agency', percentOff: 100, name: 'BearDown2026 - Agency Free' },
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// Ensure a Stripe coupon exists for this discount code, create if not
async function getOrCreateCoupon(code, discount) {
  const couponId = `discount_${code}`;
  try {
    return await stripe.coupons.retrieve(couponId);
  } catch {
    return await stripe.coupons.create({
      id: couponId,
      name: discount.name,
      percent_off: discount.percentOff,
      duration: 'forever',
    });
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tier, successUrl, cancelUrl, discountCode } = await req.json();

    // Validate discount code if provided
    let resolvedTier = tier;
    let couponId = null;

    if (discountCode) {
      const normalizedCode = discountCode.trim().toLowerCase();
      const discount = DISCOUNT_CODES[normalizedCode];
      if (!discount) {
        return Response.json({ error: 'Invalid discount code.' }, { status: 400 });
      }
      // Discount codes always unlock the agency tier
      resolvedTier = discount.tier;
      const coupon = await getOrCreateCoupon(normalizedCode, discount);
      couponId = coupon.id;
    }

    const priceId = PRICE_IDS[resolvedTier];
    if (!priceId) return Response.json({ error: 'Invalid plan tier' }, { status: 400 });

    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_email: user.email,
        plan_tier: resolvedTier,
      },
    };

    if (couponId) {
      sessionParams.discounts = [{ coupon: couponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});