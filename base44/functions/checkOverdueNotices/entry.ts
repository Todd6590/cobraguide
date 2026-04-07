import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Scheduled daily job that:
 * 1. Marks pending notices as 'overdue' if their due_date has passed
 * 2. Sends a daily digest email to admin with notices due in the next 7 days
 */

const NOTICE_TYPE_LABELS = {
  general_rights: 'General Rights Notice',
  election: 'Election Notice',
  unavailability: 'Unavailability Notice',
  early_termination: 'Early Termination Notice',
  insufficient_payment: 'Insufficient Payment Notice',
  conversion: 'Conversion Notice',
};

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  // Fetch all pending notices
  const allNotices = await base44.asServiceRole.entities.CobraNotice.list();
  const pendingNotices = allNotices.filter(n => n.status === 'pending');

  let overdueCount = 0;
  const dueSoon = [];

  for (const notice of pendingNotices) {
    if (!notice.due_date) continue;
    const dueDate = new Date(notice.due_date);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      // Mark overdue
      await base44.asServiceRole.entities.CobraNotice.update(notice.id, { status: 'overdue' });
      overdueCount++;
    } else if (dueDate <= in7Days) {
      dueSoon.push(notice);
    }
  }

  // Send digest email if there are overdue or upcoming notices
  const adminUsers = await base44.asServiceRole.entities.User.list();
  const admins = adminUsers.filter(u => u.role === 'admin');

  if ((overdueCount > 0 || dueSoon.length > 0) && admins.length > 0) {
    const overdueNotices = allNotices.filter(n => n.status === 'overdue');

    const buildRows = (notices, color) => notices.map(n => `
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:10px 16px;">${n.beneficiary_name || '—'}</td>
        <td style="padding:10px 16px;">${n.client_name || '—'}</td>
        <td style="padding:10px 16px;">${NOTICE_TYPE_LABELS[n.notice_type] || n.notice_type}</td>
        <td style="padding:10px 16px;color:${color};font-weight:600;">${formatDate(n.due_date)}</td>
      </tr>`).join('');

    const emailBody = `
<html><body style="font-family:Arial,sans-serif;font-size:13px;color:#222;max-width:760px;margin:auto;padding:24px;">
  <div style="background:#1e3a5f;color:white;padding:16px 24px;border-radius:6px 6px 0 0;">
    <h2 style="margin:0;">COBRA Notice Daily Digest</h2>
    <p style="margin:4px 0 0;opacity:0.8;">${formatDate(new Date().toISOString().split('T')[0])}</p>
  </div>
  <div style="border:1px solid #ddd;border-top:none;padding:24px;border-radius:0 0 6px 6px;">

    ${overdueCount > 0 ? `
    <h3 style="color:#dc2626;margin:0 0 8px;">⚠️ ${overdueCount} Notice(s) Marked Overdue Today</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead><tr style="background:#fee2e2;text-align:left;">
        <th style="padding:10px 16px;">Beneficiary</th>
        <th style="padding:10px 16px;">Client</th>
        <th style="padding:10px 16px;">Notice Type</th>
        <th style="padding:10px 16px;">Due Date</th>
      </tr></thead>
      <tbody>${buildRows(overdueNotices.slice(0, 20), '#dc2626')}</tbody>
    </table>` : ''}

    ${dueSoon.length > 0 ? `
    <h3 style="color:#d97706;margin:0 0 8px;">📅 ${dueSoon.length} Notice(s) Due in the Next 7 Days</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead><tr style="background:#fef3c7;text-align:left;">
        <th style="padding:10px 16px;">Beneficiary</th>
        <th style="padding:10px 16px;">Client</th>
        <th style="padding:10px 16px;">Notice Type</th>
        <th style="padding:10px 16px;">Due Date</th>
      </tr></thead>
      <tbody>${buildRows(dueSoon, '#d97706')}</tbody>
    </table>` : ''}

    <p style="color:#666;font-size:12px;margin-top:16px;">
      Log in to your COBRA administration system to view and take action on these notices.
    </p>
  </div>
</body></html>`;

    for (const admin of admins) {
      if (admin.email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: `[COBRA Daily Digest] ${overdueCount} Overdue, ${dueSoon.length} Due Soon — ${formatDate(new Date().toISOString().split('T')[0])}`,
          body: emailBody,
        });
      }
    }
  }

  return Response.json({
    markedOverdue: overdueCount,
    dueSoon: dueSoon.length,
    emailsSent: admins.length > 0 && (overdueCount > 0 || dueSoon.length > 0) ? admins.length : 0,
  });
});