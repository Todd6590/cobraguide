import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date();
    const fmtDate = (d) => d.toISOString().split('T')[0];

    // Get all StudyGroup plans where day6 email hasn't been sent
    const allPlans = await base44.asServiceRole.entities.SubscriptionPlan.filter({
      is_study_group: true,
      day6_email_sent: false,
      study_group_expired: false,
    });

    const toNotify = allPlans.filter(p => {
      if (!p.study_group_trial_start) return false;
      const start = new Date(p.study_group_trial_start);
      const diffDays = (today - start) / (1000 * 60 * 60 * 24);
      return diffDays >= 6 && diffDays < 7;
    });

    if (toNotify.length === 0) {
      console.log('No StudyGroup users on day 6 today.');
      return Response.json({ sent: 0 });
    }

    // Fetch user details from base44 Users for each plan
    const allUsers = await base44.asServiceRole.entities.User.list();
    const userMap = {};
    for (const u of allUsers) {
      userMap[u.email] = u;
    }

    let reportRows = '';
    for (const p of toNotify) {
      const u = userMap[p.user_email] || {};
      reportRows += `
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0;">${u.full_name || 'N/A'}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${p.user_email}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${p.study_group_trial_start}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${p.study_group_trial_end}</td>
        </tr>`;
    }

    const emailBody = `
      <div style="font-family:Inter,sans-serif;max-width:700px;margin:0 auto;">
        <h2 style="color:#1e3a5f;">StudyGroup Trial — Day 6 Report</h2>
        <p>The following users are on <strong>Day 6</strong> of their StudyGroup 7-day Agency trial and will lose access tomorrow unless they subscribe.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <thead style="background:#f1f5f9;">
            <tr>
              <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Name</th>
              <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Email</th>
              <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Trial Start</th>
              <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Trial End</th>
            </tr>
          </thead>
          <tbody>${reportRows}</tbody>
        </table>
        <p style="margin-top:20px;color:#64748b;font-size:13px;">Generated: ${fmtDate(today)}</p>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'help@cobrashieldpro.com',
      from_name: 'COBRA Shield Pro',
      subject: `StudyGroup Day 6 Report — ${toNotify.length} user(s) expiring tomorrow`,
      body: emailBody,
    });

    // Mark day6_email_sent for all notified users
    for (const p of toNotify) {
      await base44.asServiceRole.entities.SubscriptionPlan.update(p.id, { day6_email_sent: true });
    }

    console.log(`Day 6 report sent for ${toNotify.length} user(s).`);
    return Response.json({ sent: toNotify.length });

  } catch (error) {
    console.error('studyGroupDayReport error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});