import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const PRICE_IDS = {
  starter:      'price_1TJjEuQGEvsOY1m3h9HvKCvU',
  professional: 'price_1TJjEuQGEvsOY1m3MFZjGvTm',
  agency:       'price_1TJjEuQGEvsOY1m3p6IoDSdK',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tier, successUrl, cancelUrl } = await req.json();

    const priceId = PRICE_IDS[tier];
    if (!priceId) return Response.json({ error: 'Invalid plan tier' }, { status: 400 });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_email: user.email,
        plan_tier: tier,
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});