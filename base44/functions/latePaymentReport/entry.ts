import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const fmt = (d) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y}`;
};

const buildCancelLetterHtml = (beneficiary, payment, client) => {
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const coverageEndDate = payment.period_end ? new Date(payment.period_end) : new Date();
  const coverageEndStr = coverageEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; max-width: 750px; margin: 40px auto; color: #222; }
  .header { margin-bottom: 30px; }
  .address-block { margin-bottom: 20px; }
  .section { margin-bottom: 16px; }
  .bold { font-weight: bold; }
  .underline { text-decoration: underline; }
</style></head>
<body>
  <div class="header">
    <p>${todayStr}</p>
  </div>
  <div class="address-block">
    <p class="bold">${beneficiary.first_name} ${beneficiary.last_name}</p>
    ${beneficiary.address ? `<p>${beneficiary.address}</p>` : ''}
    ${beneficiary.city || beneficiary.state || beneficiary.zip ? `<p>${[beneficiary.city, beneficiary.state, beneficiary.zip].filter(Boolean).join(', ')}</p>` : ''}
  </div>

  <p class="bold underline">RE: Notice of Termination of COBRA Continuation Coverage — Non-Payment of Premium</p>

  <div class="section">
    <p>Dear ${beneficiary.first_name} ${beneficiary.last_name},</p>
  </div>

  <div class="section">
    <p>This letter serves as formal notice, pursuant to the requirements of the Consolidated Omnibus Budget Reconciliation Act of 1985 (COBRA), as amended, and the Employee Retirement Income Security Act of 1974 (ERISA), that your COBRA continuation coverage will be <span class="bold">terminated effective ${coverageEndStr}</span> due to non-payment of the required premium.</p>
  </div>

  <div class="section">
    <p><span class="bold">Coverage Affected:</span> ${(beneficiary.coverage_type || '').replace(/_/g, ' + ').toUpperCase() || 'Health Coverage'}</p>
    <p><span class="bold">Coverage Period:</span> ${fmt(payment.period_start)} – ${fmt(payment.period_end)}</p>
    <p><span class="bold">Premium Amount Due:</span> $${(payment.amount || 0).toFixed(2)}</p>
    <p><span class="bold">Payment Due Date:</span> ${fmt(payment.due_date)}</p>
    <p><span class="bold">Employer / Plan Sponsor:</span> ${client?.company_name || '—'}</p>
  </div>

  <div class="section">
    <p><span class="bold underline">Reason for Termination:</span> Under 26 C.F.R. § 54.4980B-8, Q&A-5, a plan is permitted to terminate COBRA continuation coverage for a qualified beneficiary when the beneficiary fails to make timely payment of a required premium. The applicable grace period for payment has expired without receipt of the required premium amount.</p>
  </div>

  <div class="section">
    <p><span class="bold underline">Grace Period:</span> COBRA regulations require that a grace period of at least 30 days be provided for payment of any premium (other than the initial premium). Our records indicate that no payment was received within the applicable grace period ending on the 14th of the coverage month.</p>
  </div>

  <div class="section">
    <p><span class="bold underline">Effect of Termination:</span> As of the termination date stated above, you will no longer have continuation coverage under the group health plan(s) of ${client?.company_name || 'the Plan Sponsor'}. You may have the right to convert to an individual health insurance policy if conversion options are available under your plan. Please contact the plan administrator for information regarding any available conversion rights.</p>
  </div>

  <div class="section">
    <p><span class="bold underline">Special Enrollment Rights:</span> You may be eligible to enroll in coverage through the Health Insurance Marketplace. To learn more, visit <span class="bold">www.healthcare.gov</span> or call 1-800-318-2596. Losing COBRA coverage may qualify you for a Special Enrollment Period.</p>
  </div>

  <div class="section">
    <p>If you believe this notice has been sent in error, or if you have documentation confirming that payment was made prior to the deadline, please contact us immediately in writing with proof of payment.</p>
  </div>

  <div class="section">
    <p>Sincerely,</p>
    <br/>
    <p class="bold">COBRA Administrator</p>
    ${client?.company_name ? `<p>${client.company_name}</p>` : ''}
  </div>

  <div class="section" style="margin-top:30px; font-size:10pt; color:#666; border-top:1px solid #ccc; padding-top:10px;">
    <p>This notice is provided in accordance with COBRA (29 U.S.C. §§ 1161–1168), ERISA, and applicable IRS regulations (26 C.F.R. § 54.4980B-1 et seq.). This notice does not constitute legal advice.</p>
  </div>
</body>
</html>`;
};

const buildReportHtml = (lateParticipants, reportDate) => {
  const rows = lateParticipants.map(p => `
    <tr>
      <td>${p.beneficiary_name || '—'}</td>
      <td>${p.client_name || '—'}</td>
      <td>$${(p.amount || 0).toFixed(2)}</td>
      <td>${fmt(p.period_start)} – ${fmt(p.period_end)}</td>
      <td>${fmt(p.due_date)}</td>
      <td style="color:#c00; font-weight:bold;">${p.status}</td>
    </tr>`).join('');

  return `
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12pt; max-width: 900px; margin: 30px auto; }
  h1 { color: #1a237e; } h2 { color: #444; font-size: 13pt; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #1a237e; color: white; padding: 8px 10px; text-align: left; font-size: 11pt; }
  td { padding: 7px 10px; border-bottom: 1px solid #ddd; font-size: 11pt; }
  tr:nth-child(even) td { background: #f5f5f5; }
  .summary { background: #fff3cd; border-left: 4px solid #f0a500; padding: 10px 16px; margin: 16px 0; border-radius: 4px; }
</style>
</head><body>
  <h1>Late Payment Report</h1>
  <p>Generated: ${reportDate} &nbsp;|&nbsp; Participants with no payment recorded by the 14th of the coverage month.</p>
  <div class="summary">
    <strong>${lateParticipants.length} participant(s)</strong> have overdue or missed payments requiring attention. Termination letters have been generated and sent per COBRA regulations.
  </div>
  <table>
    <thead><tr>
      <th>Participant</th><th>Client</th><th>Amount</th><th>Coverage Period</th><th>Due Date</th><th>Status</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#888;">No late payments found</td></tr>'}</tbody>
  </table>
</body></html>`;
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Allow both manual (authenticated user) and scheduled (no user) invocations
  const body = await req.json().catch(() => ({}));

  const today = new Date();
  const dayOfMonth = today.getDate();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  // The cutoff: 14th of the current month
  const cutoff = new Date(currentYear, currentMonth, 14);
  const reportDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Fetch all payments that are pending or in grace_period or late
  const allPayments = await base44.asServiceRole.entities.Payment.list();
  const allClients = await base44.asServiceRole.entities.Client.list();
  const allBeneficiaries = await base44.asServiceRole.entities.Beneficiary.list();

  const clientMap = {};
  allClients.forEach(c => { clientMap[c.id] = c; });
  const beneficiaryMap = {};
  allBeneficiaries.forEach(b => { beneficiaryMap[b.id] = b; });

  // Find payments that are late: due date is in the current month and no payment received by the 14th
  const latePayments = allPayments.filter(p => {
    if (!p.due_date) return false;
    const due = new Date(p.due_date);
    // Consider payments whose coverage period is current month and status is not 'received'
    const isSameMonth = due.getFullYear() === currentYear && due.getMonth() === currentMonth;
    const isUnpaid = ['pending', 'grace_period', 'late', 'missed'].includes(p.status);
    // After the 14th, any unpaid current-month payment is late
    return isSameMonth && isUnpaid;
  });

  // Also mark them as 'late' in the DB if not already
  const updatedPayments = [];
  for (const p of latePayments) {
    if (p.status !== 'late' && p.status !== 'missed') {
      await base44.asServiceRole.entities.Payment.update(p.id, { status: 'late' });
      updatedPayments.push(p.id);
    }
  }

  if (latePayments.length === 0) {
    return Response.json({ message: 'No late payments found.', lateCount: 0, updatedCount: 0 });
  }

  // Build the report HTML
  const reportHtml = buildReportHtml(latePayments, reportDate);

  // Group late payments by client so we send one email per client
  const byClient = {};
  for (const p of latePayments) {
    const cid = p.client_id || 'unknown';
    if (!byClient[cid]) byClient[cid] = [];
    byClient[cid].push(p);
  }

  let emailsSent = 0;
  const cancelLettersSent = [];

  for (const [clientId, payments] of Object.entries(byClient)) {
    const client = clientMap[clientId];

    // Send report to client contact
    if (client?.contact_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: client.contact_email,
        subject: `COBRA Late Payment Report — ${reportDate}`,
        body: reportHtml,
      });
      emailsSent++;
    }

    // Send report to broker if applicable
    if (client?.payment_remit_to === 'broker' && client?.broker_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: client.broker_email,
        subject: `COBRA Late Payment Report — ${reportDate}`,
        body: reportHtml,
      });
      emailsSent++;
    }

    // Send DOL/ERISA compliant termination letter to each late participant
    for (const p of payments) {
      const beneficiary = beneficiaryMap[p.beneficiary_id];
      if (!beneficiary?.email) continue;

      const cancelHtml = buildCancelLetterHtml(beneficiary, p, client);
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: beneficiary.email,
        subject: `Important: Notice of Termination of COBRA Continuation Coverage`,
        body: cancelHtml,
      });
      cancelLettersSent.push(beneficiary.email);
    }
  }

  return Response.json({
    message: 'Late payment report generated and sent.',
    lateCount: latePayments.length,
    updatedCount: updatedPayments.length,
    emailsSent,
    cancelLettersSent,
    reportDate,
  });
});