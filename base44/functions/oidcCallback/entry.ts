import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const VALID_PLANS = ['master', 'cobra_monthly'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { code, state } = body;

    if (!code) {
      return Response.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    const clientId = Deno.env.get('OIDC_CLIENT_ID');
    const clientSecret = Deno.env.get('OIDC_CLIENT_SECRET');
    const redirectUri = Deno.env.get('OIDC_REDIRECT_URI');
    const discoveryUrl = Deno.env.get('OIDC_DISCOVERY_URL');

    // Fetch OIDC discovery document
    const discoveryRes = await fetch(discoveryUrl);
    const discovery = await discoveryRes.json();
    const tokenEndpoint = discovery.token_endpoint;
    const userInfoEndpoint = discovery.userinfo_endpoint;

    // Exchange code for tokens
    const tokenRes = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Token exchange failed:', err);
      return Response.json({ error: 'Token exchange failed', detail: err }, { status: 400 });
    }

    const tokens = await tokenRes.json();
    const accessToken = tokens.access_token;

    // Fetch user info
    const userInfoRes = await fetch(userInfoEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoRes.ok) {
      const err = await userInfoRes.text();
      console.error('UserInfo fetch failed:', err);
      return Response.json({ error: 'Failed to fetch user info', detail: err }, { status: 400 });
    }

    const userInfo = await userInfoRes.json();
    console.log('OIDC userInfo:', JSON.stringify(userInfo));

    // Validate plan claim
    const userPlan = userInfo.plan || userInfo.subscription_plan || userInfo['https://brokertoolbox.net/plan'];
    const hasValidPlan = userPlan && VALID_PLANS.some(p => 
      Array.isArray(userPlan) ? userPlan.includes(p) : userPlan === p
    );

    if (!hasValidPlan) {
      console.log('User does not have a valid plan:', userPlan);
      return Response.json({ error: 'no_valid_plan', plan: userPlan }, { status: 403 });
    }

    const email = userInfo.email;
    const name = userInfo.name || userInfo.given_name || email;

    if (!email) {
      return Response.json({ error: 'No email in user info' }, { status: 400 });
    }

    // Log in or register the user via Base44 service role
    const loginResult = await base44.asServiceRole.auth.loginOrRegister({
      email,
      full_name: name,
      role: 'user',
    });

    console.log('Login result for', email, '- success');

    return Response.json({
      success: true,
      token: loginResult.token,
      user: { email, name },
    });

  } catch (error) {
    console.error('OIDC callback error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});