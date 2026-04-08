import Stripe from 'npm:stripe@14.21.0';

const PRICE_IDS = {
  starter:      'price_1TJxKE9E4N4pWf6MhTAyyqvF',  // $29/mo
  professional: 'price_1TJxKD9E4N4pWf6MSbNXpWLO',  // $69/mo
  agency:       'price_1TJxKK9E4N4pWf6MUj8fTs2s',  // $99/mo
};

const DISCOUNT_CODES = {
  'beardown2026': { tier: 'agency', percentOff: 100, name: 'BearDown2026 - Agency Free' },
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

async function getOrCreateCoupon(code, discount) {
  const couponId = `discount_${code}`;
  try {
    return await stripe.coupons.retrieve(couponId);
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
    const body = await req.json();
    const { tier, successUrl, cancelUrl, discountCode, userEmail } = body;

    if (!userEmail) {
      return Response.json({ error: 'User email is required' }, { status: 400 });
    }

    console.log('Creating checkout for:', userEmail, 'tier:', tier);

    let resolvedTier = tier;
    let couponId = null;

    if (discountCode) {
      const normalizedCode = discountCode.trim().toLowerCase();
      const discount = DISCOUNT_CODES[normalizedCode];
      if (!discount) {
        return Response.json({ error: 'Invalid discount code.' }, { status: 400 });
      }
      resolvedTier = discount.tier;
      const coupon = await getOrCreateCoupon(normalizedCode, discount);
      couponId = coupon.id;
    }

    const priceId = PRICE_IDS[resolvedTier];
    if (!priceId) return Response.json({ error: 'Invalid plan tier' }, { status: 400 });

    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_email: userEmail,
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
    }));
    return Response.json({
      error: error.message || 'Unknown error',
      code: error.code,
      type: error.type,
    }, { status: 500 });
  }
});