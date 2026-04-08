import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const PRICE_IDS = {
  starter:      'price_1TJxKE9E4N4pWf6MhTAyyqvF',  // $29/mo
  professional: 'price_1TJxKD9E4N4pWf6MSbNXpWLO',  // $69/mo
  agency:       'price_1TJxKK9E4N4pWf6MUj8fTs2s',  // $99/mo
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
    const existing = await stripe.coupons.retrieve(couponId);
    return existing;
  } catch (err) {
    if (err.statusCode === 404 || err.code === 'resource_missing') {
      return await stripe.coupons.create({
        id: couponId,
        name: discount.name,
        percent_off: discount.percentOff,
        duration: 'forever',
      });
    }
    throw err;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    const { tier, successUrl, cancelUrl, discountCode, userEmail } = body;

    let email = userEmail;
    try {
      const user = await base44.auth.me();
      if (user) email = user.email;
    } catch (authErr) {
      console.error('Auth error:', authErr.message);
    }

    if (!email) {
      console.error('No email available - auth failed and no userEmail provided');
      return Response.json({ error: 'Unauthorized - could not identify user' }, { status: 401 });
    }

    console.log('Creating checkout for:', email, 'tier:', tier);

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
      customer_email: email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_email: email,
        plan_tier: resolvedTier,
      },
    };

    if (couponId) {
      sessionParams.discounts = [{ coupon: couponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('CHECKOUT ERROR:', JSON.stringify({
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      type: error.type,
      raw: error.raw,
    }));
    return Response.json({ 
      error: error.message || 'Unknown error', 
      code: error.code, 
      type: error.type,
      statusCode: error.statusCode,
    }, { status: 500 });
  }
});