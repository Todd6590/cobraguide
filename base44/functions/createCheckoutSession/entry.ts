import Stripe from 'npm:stripe@14.21.0';

const PRICE_IDS = {
  starter:      'price_1TMDhQ9E4N4pWf6Mys1q6VXG',  // $19/mo (sale)
  professional: 'price_1TMDi19E4N4pWf6MhH7skcWm',  // $49/mo (sale)
  agency:       'price_1TMDfv9E4N4pWf6MwO2cSWDt',  // $69/mo (sale)
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { tier, successUrl, cancelUrl, discountCode, userEmail, referralCode } = body;

    if (!userEmail) {
      return Response.json({ error: 'User email is required' }, { status: 400 });
    }

    console.log('Creating checkout for:', userEmail, 'tier:', tier);

    let promotionCodeId = null;

    if (discountCode) {
      const promoCodes = await stripe.promotionCodes.list({ code: discountCode.trim(), active: true, limit: 1 });
      if (promoCodes.data.length === 0) {
        return Response.json({ error: 'Invalid discount code.' }, { status: 400 });
      }
      promotionCodeId = promoCodes.data[0].id;
    }

    const priceId = PRICE_IDS[tier];
    if (!priceId) return Response.json({ error: 'Invalid plan tier' }, { status: 400 });

    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_email: userEmail,
        plan_tier: tier,
        ...(referralCode ? { referral_code: referralCode } : {}),
      },
    };

    if (promotionCodeId) {
      sessionParams.discounts = [{ promotion_code: promotionCodeId }];
      // allow_promotion_codes is mutually exclusive with discounts
      delete sessionParams.allow_promotion_codes;
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