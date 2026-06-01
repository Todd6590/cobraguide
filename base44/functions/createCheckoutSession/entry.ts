import Stripe from 'npm:stripe@14.21.0';

// Single plan — COBRA Shield Pro at $19/mo
const PRICE_ID = 'price_1TMDhQ9E4N4pWf6Mys1q6VXG';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { successUrl, cancelUrl, discountCode, userEmail, referralCode } = body;

    if (!userEmail) {
      return Response.json({ error: 'User email is required' }, { status: 400 });
    }

    console.log('Creating checkout for:', userEmail);

    let promotionCodeId = null;

    if (discountCode) {
      const promoCodes = await stripe.promotionCodes.list({ code: discountCode.trim(), active: true, limit: 1 });
      if (promoCodes.data.length === 0) {
        return Response.json({ error: 'Invalid discount code.' }, { status: 400 });
      }
      promotionCodeId = promoCodes.data[0].id;
    }

    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      customer_email: userEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_email: userEmail,
        plan_tier: 'professional',
        ...(referralCode ? { referral_code: referralCode } : {}),
      },
    };

    if (promotionCodeId) {
      sessionParams.discounts = [{ promotion_code: promotionCodeId }];
      delete sessionParams.allow_promotion_codes;
      sessionParams.payment_method_collection = 'if_required';
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