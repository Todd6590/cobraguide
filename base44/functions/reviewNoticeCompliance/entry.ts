import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Monthly compliance review:
 * - Checks all active/pending notices against current DOL rules
 * - Detects missing required notices for active beneficiaries
 * - Detects notices where dates are outside allowed windows
 * - Updates notice statuses as needed
 * - Emails all admins a detailed compliance report with any changes made
 */

const COVERAGE_MONTHS = {
  termination: 18,
  reduction_in_hours: 18,
  death_of_employee: 36,
  divorce: 36,
  medicare_entitlement: 36,
  loss_of_dependent_status: 36,
  employer_bankruptcy: 18,
};

const NOTICE_TYPE_LABELS = {
  general_rights: 'General Rights Notice',
  election: 'Election Notice',
  unavailability: 'Unavailability Notice',
  early_termination: 'Early Termination Notice',
  insufficient_payment: 'Insufficient Payment Notice',
  conversion: 'Conversion Notice',
};

const EVENT_TYPE_LABELS = {
  termination: 'Termination of Employment',
  reduction_in_hours: 'Reduction in Hours',
  death_of_employee: 'Death of Employee',
  divorce: 'Divorce / Legal Separation',
  medicare_entitlement: 'Medicare Entitlement',
  loss_of_dependent_status: 'Loss of Dependent Status',
  employer_bankruptcy: 'Employer Bankruptcy',
};

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toDateOnly(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function lastDayOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function firstDayOfNextMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

function isoDate(d) {
  return d.toISOString().split('T')[0];
}

/**
 * Check compliance for a single qualifying event + its notices
 * Returns array of { type: 'error'|'warning'|'fixed', message, noticeId? }
 */
function checkEventCompliance(event, eventNotices, beneficiary) {
  const issues = [];
  const notificationDate = event.notification_date
    ? new Date(event.notification_date)
    : addDays(new Date(event.event_date), 30);

  // Election notice must be sent within 14 days of plan admin receiving notification
  const electionNotice = eventNotices.find(n => n.notice_type === 'election');
  if (!electionNotice) {
    issues.push({ type: 'error', message: `Missing required Election Notice for event: ${EVENT_TYPE_LABELS[event.event_type] || event.event_type} (${formatDate(event.event_date)})` });
  } else {
    const electionDue = addDays(notificationDate, 14);
    const storedDue = electionNotice.due_date ? new Date(electionNotice.due_date) : null;
    if (storedDue) {
      const diff = Math.abs(storedDue - electionDue) / (1000 * 60 * 60 * 24);
      if (diff > 2) {
        issues.push({
          type: 'warning',
          noticeId: electionNotice.id,
          message: `Election Notice due date (${formatDate(electionNotice.due_date)}) deviates from DOL-calculated deadline (${formatDate(isoDate(electionDue))}). Per 29 CFR § 2590.606-4, the election notice must be provided within 14 days after the plan administrator receives notification.`,
        });
      }
    }
  }

  // COBRA end date check
  if (beneficiary && beneficiary.cobra_start_date && beneficiary.cobra_end_date && event.event_type) {
    const expectedMonths = COVERAGE_MONTHS[event.event_type] || 18;
    const expectedEnd = addMonths(new Date(beneficiary.cobra_start_date), expectedMonths);
    const actualEnd = new Date(beneficiary.cobra_end_date);
    const diff = Math.abs(expectedEnd - actualEnd) / (1000 * 60 * 60 * 24);
    if (diff > 3) {
      issues.push({
        type: 'warning',
        message: `COBRA end date (${formatDate(beneficiary.cobra_end_date)}) for ${beneficiary.first_name} ${beneficiary.last_name} differs from the DOL maximum period. Expected end date: ${formatDate(isoDate(expectedEnd))} (${expectedMonths} months from ${formatDate(beneficiary.cobra_start_date)}).`,
      });
    }
  }

  // Election deadline check: 60 days from later of coverage loss or notice date
  if (electionNotice && electionNotice.election_deadline) {
    const coverageLoss = event.coverage_loss_date
      ? new Date(event.coverage_loss_date)
      : lastDayOfMonth(new Date(event.event_date));
    const noticeDate = electionNotice.sent_date
      ? new Date(electionNotice.sent_date)
      : new Date(electionNotice.due_date);
    const baseDate = coverageLoss > noticeDate ? coverageLoss : noticeDate;
    const expectedDeadline = addDays(baseDate, 60);
    const storedDeadline = new Date(electionNotice.election_deadline);
    const diff = Math.abs(expectedDeadline - storedDeadline) / (1000 * 60 * 60 * 24);
    if (diff > 2) {
      issues.push({
        type: 'warning',
        noticeId: electionNotice.id,
        message: `Election deadline (${formatDate(electionNotice.election_deadline)}) may not match the 60-day requirement from coverage loss / notice date. Expected: ${formatDate(isoDate(expectedDeadline))}.`,
      });
    }
  }

  return issues;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Allow both scheduled (no user) and manual (admin user) invocations
  const user = await base44.auth.me().catch(() => null);
  if (user && user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const today = toDateOnly(new Date());

  // Load all data
  const [allNotices, allBeneficiaries, allEvents, allClients, adminUsers] = await Promise.all([
    base44.asServiceRole.entities.CobraNotice.list(),
    base44.asServiceRole.entities.Beneficiary.list(),
    base44.asServiceRole.entities.QualifyingEvent.list(),
    base44.asServiceRole.entities.Client.list(),
    base44.asServiceRole.entities.User.list(),
  ]);

  const admins = adminUsers.filter(u => u.role === 'admin' && u.email);
  const changes = [];     // things we fixed automatically
  const warnings = [];    // things needing human attention
  let noticesUpdated = 0;

  // 1. Mark overdue notices
  for (const notice of allNotices) {
    if (notice.status !== 'pending' || !notice.due_date) continue;
    const dueDate = toDateOnly(new Date(notice.due_date));
    if (dueDate < today) {
      await base44.asServiceRole.entities.CobraNotice.update(notice.id, { status: 'overdue' });
      noticesUpdated++;
      changes.push({
        type: 'overdue',
        message: `Marked overdue: ${NOTICE_TYPE_LABELS[notice.notice_type] || notice.notice_type} for ${notice.beneficiary_name || '?'} (was due ${formatDate(notice.due_date)})`,
      });
    }
  }

  // 2. Per-event compliance checks
  for (const event of allEvents) {
    const eventNotices = allNotices.filter(n => n.qualifying_event_id === event.id);
    const beneficiary = allBeneficiaries.find(b => b.id === event.beneficiary_id);
    const issues = checkEventCompliance(event, eventNotices, beneficiary);

    for (const issue of issues) {
      if (issue.type === 'error') {
        warnings.push({ severity: 'error', message: issue.message, beneficiary: beneficiary?.first_name + ' ' + beneficiary?.last_name, event: EVENT_TYPE_LABELS[event.event_type] || event.event_type });
      } else {
        warnings.push({ severity: 'warning', message: issue.message, beneficiary: beneficiary?.first_name + ' ' + beneficiary?.last_name, event: EVENT_TYPE_LABELS[event.event_type] || event.event_type });
      }
    }
  }

  // 3. Check beneficiaries with active COBRA for missing conversion notices
  for (const b of allBeneficiaries) {
    if (!b.cobra_end_date || !['active', 'elected'].includes(b.cobra_status)) continue;
    const endDate = new Date(b.cobra_end_date);
    const conversionWindowStart = addDays(endDate, -180);
    const hasConversion = allNotices.some(n => n.beneficiary_id === b.id && n.notice_type === 'conversion');

    if (!hasConversion && today >= toDateOnly(conversionWindowStart)) {
      warnings.push({
        severity: 'warning',
        message: `Missing Conversion Notice for ${b.first_name} ${b.last_name}. COBRA ends ${formatDate(b.cobra_end_date)} — conversion notice should be sent within 180 days of COBRA expiration.`,
        beneficiary: `${b.first_name} ${b.last_name}`,
        event: 'Conversion Window',
      });
    }
  }

  const totalIssues = changes.length + warnings.length;
  const reportDate = formatDate(new Date().toISOString().split('T')[0]);

  // Send email to all admins
  if (admins.length > 0) {
    const buildChangeRows = (items, bgColor) => items.map(item => `
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:10px 16px;color:${bgColor === '#fee2e2' ? '#dc2626' : '#d97706'};font-size:18px;">
          ${bgColor === '#fee2e2' ? '⚠️' : '📋'}
        </td>
        <td style="padding:10px 16px;">
          <strong>${item.beneficiary || ''}</strong>${item.event ? ` — ${item.event}` : ''}<br/>
          <span style="color:#555;font-size:12px;">${item.message}</span>
        </td>
      </tr>`).join('');

    const emailBody = `
<html><body style="font-family:Arial,sans-serif;font-size:13px;color:#222;max-width:800px;margin:auto;padding:24px;">
  <div style="background:#1e3a5f;color:white;padding:16px 24px;border-radius:6px 6px 0 0;">
    <h2 style="margin:0;">COBRA Monthly Compliance Review</h2>
    <p style="margin:4px 0 0;opacity:0.8;">Report Date: ${reportDate}</p>
  </div>
  <div style="border:1px solid #ddd;border-top:none;padding:24px;border-radius:0 0 6px 6px;">

    <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap;">
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:12px 20px;min-width:140px;">
        <div style="font-size:24px;font-weight:bold;color:#0369a1;">${noticesUpdated}</div>
        <div style="color:#555;font-size:12px;">Notices Updated</div>
      </div>
      <div style="background:#fef9c3;border:1px solid #fde047;border-radius:6px;padding:12px 20px;min-width:140px;">
        <div style="font-size:24px;font-weight:bold;color:#a16207;">${warnings.length}</div>
        <div style="color:#555;font-size:12px;">Compliance Warnings</div>
      </div>
      <div style="background:${totalIssues === 0 ? '#f0fdf4' : '#fff7ed'};border:1px solid ${totalIssues === 0 ? '#86efac' : '#fed7aa'};border-radius:6px;padding:12px 20px;min-width:140px;">
        <div style="font-size:24px;font-weight:bold;color:${totalIssues === 0 ? '#15803d' : '#c2410c'};">${totalIssues === 0 ? '✓' : totalIssues}</div>
        <div style="color:#555;font-size:12px;">${totalIssues === 0 ? 'Fully Compliant' : 'Total Items'}</div>
      </div>
    </div>

    ${changes.length > 0 ? `
    <h3 style="color:#1e3a5f;margin:0 0 8px;">Automatic Updates Made (${changes.length})</h3>
    <p style="color:#555;font-size:12px;margin:0 0 12px;">The following changes were automatically applied during this review:</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fafafa;border-radius:4px;">
      <tbody>${changes.map(c => `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px 16px;color:#dc2626;font-size:18px;">🔄</td>
          <td style="padding:10px 16px;color:#555;font-size:12px;">${c.message}</td>
        </tr>`).join('')}
      </tbody>
    </table>` : ''}

    ${warnings.filter(w => w.severity === 'error').length > 0 ? `
    <h3 style="color:#dc2626;margin:0 0 8px;">⚠️ Compliance Errors Requiring Immediate Attention (${warnings.filter(w => w.severity === 'error').length})</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fafafa;border-radius:4px;">
      <tbody>${buildChangeRows(warnings.filter(w => w.severity === 'error'), '#fee2e2')}</tbody>
    </table>` : ''}

    ${warnings.filter(w => w.severity === 'warning').length > 0 ? `
    <h3 style="color:#d97706;margin:0 0 8px;">📋 Compliance Warnings (${warnings.filter(w => w.severity === 'warning').length})</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fafafa;border-radius:4px;">
      <tbody>${buildChangeRows(warnings.filter(w => w.severity === 'warning'), '#fef3c7')}</tbody>
    </table>` : ''}

    ${totalIssues === 0 ? `
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:16px;text-align:center;">
      <p style="color:#15803d;font-size:14px;font-weight:bold;margin:0;">✅ All notices are compliant with current DOL/ERISA requirements.</p>
    </div>` : ''}

    <p style="color:#666;font-size:11px;margin-top:24px;border-top:1px solid #eee;padding-top:12px;">
      This review was conducted in accordance with ERISA § 606 and 29 CFR Part 2590. 
      Log in to your COBRA administration system to view all notices and take action on any items listed above.
    </p>
  </div>
</body></html>`;

    for (const admin of admins) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `[COBRA Compliance Review] ${totalIssues === 0 ? '✅ All Compliant' : `${totalIssues} Item(s) Require Attention`} — ${reportDate}`,
        body: emailBody,
      });
    }
  }

  return Response.json({
    noticesUpdated,
    complianceWarnings: warnings.length,
    totalIssues,
    emailsSent: admins.length,
    changes,
    warnings,
  });
});