import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Converts email to the same slug format used on the frontend
function emailToCode(email) {
  return email.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { referral_code, referred_email } = await req.json();
    if (!referral_code || !referred_email) {
      return Response.json({ error: 'referral_code and referred_email required' }, { status: 400 });
    }

    // Prevent self-referral
    if (emailToCode(referred_email) === referral_code) {
      return Response.json({ message: 'Self-referral ignored' });
    }

    // Check if already recorded
    const existing = await base44.asServiceRole.entities.Referral.filter({
      referral_code,
      referred_email,
    });
    if (existing.length > 0) {
      return Response.json({ message: 'Already recorded' });
    }

    // Find the referrer by looking for users whose email hashes to this code
    // We search SubscriptionPlan records to find all user emails, then match
    const allPlans = await base44.asServiceRole.entities.SubscriptionPlan.list();
    const referrerPlan = allPlans.find(p => emailToCode(p.user_email) === referral_code);
    const referrerEmail = referrerPlan?.user_email || null;

    await base44.asServiceRole.entities.Referral.create({
      referral_code,
      referred_email,
      referrer_email: referrerEmail || '',
      status: 'signed_up',
    });

    console.log(`Referral signup recorded: ${referral_code} → ${referred_email} (referrer: ${referrerEmail})`);
    return Response.json({ success: true });

  } catch (error) {
    console.error('recordReferralSignup error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});