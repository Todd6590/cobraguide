import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { authorizeCronOrAdmin } from '../../shared/cronAuth.ts';

const fmt = (d) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y}`;
};

const NOTICE_LABELS = {
  early_termination: 'Early Termination Notice',
  conversion: 'Conversion Notice',
};

const buildReminderHtml = (notices, client) => {
  const rows = notices.map(n => `
    <tr>
      <td style="padding:8px 12px; border-bottom:1px solid #ddd;">${n.beneficiary_name || '—'}</td>
      <td style="padding:8px 12px; border-bottom:1px solid #ddd;">${NOTICE_LABELS[n.notice_type] || n.notice_type}</td>
      <td style="padding:8px 12px; border-bottom:1px solid #ddd; font-weight:bold; color:#c00;">${fmt(n.due_date)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif; font-size:12pt; line-height:1.6; max-width:700px; margin:40px auto; color:#222;">
  <div style="background:#1a237e; color:#fff; padding:20px 28px; border-radius:6px 6px 0 0;">
    <h2 style="margin:0; font-size:16pt;">⚠️ COBRA Notice Mailing Reminder</h2>
    <p style="margin:6px 0 0; font-size:11pt; opacity:0.9;">Action required: notices due in 10 days</p>
  </div>
  <div style="background:#fff; border:1px solid #ddd; border-top:none; padding:24px 28px; border-radius:0 0 6px 6px;">
    <p>Dear ${client?.contact_name || 'COBRA Administrator'},</p>
    <p>This is a reminder that the following COBRA notice(s) for <strong>${client?.company_name || 'your plan'}</strong> are due to be <strong>printed and mailed</strong> within the next 10 days. Please log in to the system and mail these notices promptly to remain in compliance with DOL/ERISA requirements.</p>

    <table style="width:100%; border-collapse:collapse; margin:20px 0;">
      <thead>
        <tr style="background:#f0f4ff;">
          <th style="padding:10px 12px; text-align:left; border-bottom:2px solid #1a237e; font-size:11pt;">Participant</th>
          <th style="padding:10px 12px; text-align:left; border-bottom:2px solid #1a237e; font-size:11pt;">Notice Type</th>
          <th style="padding:10px 12px; text-align:left; border-bottom:2px solid #1a237e; font-size:11pt;">Due Date</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="background:#fff8e1; border-left:4px solid #f0a500; padding:12px 16px; margin:20px 0; border-radius:4px;">
      <strong>How to mail these notices:</strong>
      <ol style="margin:8px 0 0 16px; padding:0;">
        <li>Log in to the COBRA Administration system</li>
        <li>Navigate to <strong>Notices</strong> and locate the notice for each participant listed above</li>
        <li>Click the notice to open the full document and use the <strong>Print</strong> button</li>
        <li>Mail via First Class Mail (or Certified Mail for documentation purposes)</li>
        <li>Update the notice status to <strong>Sent</strong> in the system after mailing</li>
      </ol>
    </div>

    <p style="color:#666; font-size:10pt; border-top:1px solid #eee; padding-top:12px; margin-top:20px;">
      This is an automated reminder from your COBRA Administration system. Failure to send required notices by their due dates may result in DOL/ERISA penalties. Please contact your COBRA administrator if you have questions.
    </p>
  </div>
</body>
</html>`;
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json().catch(() => ({}));
  const auth = await authorizeCronOrAdmin(base44, body);
  if (!auth.ok) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  // Target: notices whose due_date is exactly 10 days from today
  const target = new Date(today);
  target.setDate(target.getDate() + 10);
  const targetStr = target.toISOString().split('T')[0]; // yyyy-MM-dd

  const allNotices = await base44.asServiceRole.entities.CobraNotice.list();
  const allClients = await base44.asServiceRole.entities.Client.list();

  const clientMap = {};
  allClients.forEach(c => { clientMap[c.id] = c; });

  // Filter for early_termination and conversion notices due in exactly 10 days, still pending/overdue
  const dueNotices = allNotices.filter(n =>
    ['early_termination', 'conversion'].includes(n.notice_type) &&
    n.due_date === targetStr &&
    ['pending', 'overdue'].includes(n.status)
  );

  if (dueNotices.length === 0) {
    return Response.json({ message: 'No notices due in 10 days.', remindersCount: 0 });
  }

  // Group by client
  const byClient = {};
  for (const n of dueNotices) {
    const cid = n.client_id || 'unknown';
    if (!byClient[cid]) byClient[cid] = [];
    byClient[cid].push(n);
  }

  let remindersSent = 0;

  for (const [clientId, notices] of Object.entries(byClient)) {
    const client = clientMap[clientId];
    const html = buildReminderHtml(notices, client);
    const subject = `Action Required: COBRA Notice(s) Due in 10 Days — ${client?.company_name || 'Your Plan'}`;

    // Email client contact
    if (client?.contact_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: client.contact_email,
        subject,
        body: html,
      });
      remindersSent++;
    }

    // Email broker if applicable
    if (client?.payment_remit_to === 'broker' && client?.broker_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: client.broker_email,
        subject,
        body: html,
      });
      remindersSent++;
    }
  }

  return Response.json({
    message: 'Reminder emails sent.',
    noticesFound: dueNotices.length,
    remindersSent,
    targetDueDate: targetStr,
  });
});