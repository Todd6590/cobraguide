import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Backend function to send COBRA notice emails.
 * Accepts: { noticeId, adminEmail }
 * Looks up all related data server-side and sends both the admin notice email
 * and the client contact notification email.
 */

const EVENT_TYPE_LABELS = {
  termination: 'Termination of Employment',
  reduction_in_hours: 'Reduction in Hours',
  death_of_employee: 'Death of Employee',
  divorce: 'Divorce / Legal Separation',
  medicare_entitlement: 'Medicare Entitlement',
  loss_of_dependent_status: 'Loss of Dependent Status',
  employer_bankruptcy: 'Employer Bankruptcy',
};

const NOTICE_TYPE_LABELS = {
  general_rights: 'General Rights Notice',
  election: 'Election Notice',
  unavailability: 'Unavailability Notice',
  early_termination: 'Early Termination Notice',
  insufficient_payment: 'Insufficient Payment Notice',
  conversion: 'Conversion Notice',
};

const COVERAGE_MONTHS = {
  termination: 18,
  reduction_in_hours: 18,
  death_of_employee: 36,
  divorce: 36,
  medicare_entitlement: 36,
  loss_of_dependent_status: 36,
  employer_bankruptcy: 18,
};

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function buildNoticeContent(noticeType, beneficiary, qualifyingEvent, client) {
  const today = formatDate(new Date().toISOString().split('T')[0]);
  const beneficiaryName = `${beneficiary.first_name} ${beneficiary.last_name}`;
  const eventLabel = EVENT_TYPE_LABELS[qualifyingEvent?.event_type] || 'Qualifying Event';
  const eventDate = qualifyingEvent?.event_date ? formatDate(qualifyingEvent.event_date) : '';
  const cobraEndDate = beneficiary.cobra_end_date ? formatDate(beneficiary.cobra_end_date) : 'N/A';
  const cobraStartDate = beneficiary.cobra_start_date ? formatDate(beneficiary.cobra_start_date) : 'N/A';
  const premium = beneficiary.monthly_premium ? `$${Number(beneficiary.monthly_premium).toFixed(2)}` : 'as determined by the plan';
  const coverageMonths = COVERAGE_MONTHS[qualifyingEvent?.event_type] || 18;

  const header = [
    'IMPORTANT NOTICE — COBRA CONTINUATION COVERAGE',
    `Date: ${today}`,
    '',
    `To: ${beneficiaryName}`,
    beneficiary.address || '',
    `${beneficiary.city ? beneficiary.city + ', ' : ''}${beneficiary.state || ''} ${beneficiary.zip || ''}`,
    '',
    `From: ${client?.company_name || 'Plan Administrator'}`,
    client?.address || '',
    `${client?.city ? client.city + ', ' : ''}${client?.state || ''} ${client?.zip || ''}`,
    `Plan Administrator Contact: ${client?.contact_name || ''}, ${client?.contact_email || ''}, ${client?.contact_phone || ''}`,
  ].join('\n').trim();

  if (noticeType === 'election') {
    return `${header}

RE: NOTICE OF COBRA CONTINUATION COVERAGE RIGHTS

INTRODUCTION

This notice contains important information about your right to continue your health care coverage in the ${client?.company_name || 'group health plan'} (the "Plan"). Please read this information carefully.

WHY ARE YOU RECEIVING THIS NOTICE?

You are receiving this notice because a qualifying event has occurred. Specifically: ${eventLabel} on ${eventDate}. As a result, your coverage under the Plan will end (or has ended). Federal law gives certain individuals the right to elect continuation coverage (COBRA) under the Plan.

WHO IS ENTITLED TO ELECT COBRA CONTINUATION COVERAGE?

${beneficiaryName} (and any eligible dependents covered under the Plan) may be entitled to elect COBRA continuation coverage.

WHAT IS COBRA CONTINUATION COVERAGE?

COBRA continuation coverage is the same coverage that the Plan gives to other active participants and beneficiaries who are not receiving COBRA coverage.

HOW LONG WILL CONTINUATION COVERAGE LAST?

In the case of ${eventLabel}, continuation coverage may be available for up to ${coverageMonths} months, beginning ${cobraStartDate} and ending no later than ${cobraEndDate}, unless coverage is extended or terminated early.

COBRA coverage may be terminated early if:
• Premiums are not paid on time
• The employer ceases to maintain any group health plan
• Coverage under another group health plan or Medicare occurs after the COBRA election

COST OF CONTINUATION COVERAGE

The monthly cost for COBRA continuation coverage is ${premium} per month. This amount may not exceed 102% of the applicable premium.

HOW DO YOU ELECT COBRA CONTINUATION COVERAGE?

To elect COBRA continuation coverage, complete the election form and return it to the Plan Administrator. You must elect within 60 days from the later of: (1) the date coverage ends, or (2) the date of this notice.

IF YOU HAVE QUESTIONS

Contact the Plan Administrator at the address above, or the U.S. Department of Labor's Employee Benefits Security Administration (EBSA) at 1-866-444-3272 or www.dol.gov/ebsa.

KEEP THIS NOTICE FOR YOUR RECORDS.
`;
  }

  if (noticeType === 'early_termination') {
    return `${header}

RE: NOTICE OF EARLY TERMINATION OF COBRA CONTINUATION COVERAGE

Dear ${beneficiaryName},

We are writing to inform you that your COBRA continuation coverage under the ${client?.company_name || ''} group health plan will be terminated before the maximum continuation coverage period ends.

Your COBRA coverage will terminate on ${cobraEndDate}.

REASON FOR EARLY TERMINATION

Your COBRA continuation coverage is being terminated because: [Reason to be provided by plan administrator.]

YOUR RIGHTS

You may have the right to convert to an individual policy under the terms of the group health plan. Please contact the Plan Administrator for information about conversion rights.

${client?.contact_name || 'Plan Administrator'}
${client?.contact_email || ''}
${client?.contact_phone || ''}

Or contact the U.S. Department of Labor, EBSA, at 1-866-444-3272.

KEEP THIS NOTICE FOR YOUR RECORDS.
`;
  }

  if (noticeType === 'conversion') {
    return `${header}

RE: NOTICE OF CONVERSION RIGHTS — YOUR COBRA COVERAGE IS ENDING

Dear ${beneficiaryName},

Your COBRA continuation coverage under the ${client?.company_name || ''} group health plan will reach its maximum duration and end on ${cobraEndDate}.

YOUR CONVERSION RIGHTS

You may have the right to convert your COBRA continuation coverage to an individual health insurance policy without evidence of insurability. Contact the Plan Administrator as soon as possible:

${client?.contact_name || 'Plan Administrator'}
${client?.contact_email || ''}
${client?.contact_phone || ''}

MARKETPLACE COVERAGE ALTERNATIVE

Losing COBRA coverage is a qualifying life event that allows you to enroll in a Marketplace plan. Visit www.healthcare.gov for more information.

KEEP THIS NOTICE FOR YOUR RECORDS.
`;
  }

  return `${header}

RE: ${NOTICE_TYPE_LABELS[noticeType] || 'COBRA Notice'}

Dear ${beneficiaryName},

This notice is sent on behalf of ${client?.company_name || 'the Plan Administrator'} regarding your COBRA continuation coverage.

Please contact the Plan Administrator for details:
${client?.contact_name || ''}
${client?.contact_email || ''}
${client?.contact_phone || ''}
`;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { noticeId, adminEmail } = await req.json();
  if (!noticeId) return Response.json({ error: 'noticeId is required' }, { status: 400 });

  // Fetch all required records
  const [notices, beneficiaries, clients, events] = await Promise.all([
    base44.entities.CobraNotice.list(),
    base44.entities.Beneficiary.list(),
    base44.entities.Client.list(),
    base44.entities.QualifyingEvent.list(),
  ]);

  const notice = notices.find(n => n.id === noticeId);
  if (!notice) return Response.json({ error: 'Notice not found' }, { status: 404 });

  const beneficiary = beneficiaries.find(b => b.id === notice.beneficiary_id);
  const client = clients.find(c => c.id === notice.client_id);
  const qualifyingEvent = events.find(e => e.id === notice.qualifying_event_id);

  if (!beneficiary) return Response.json({ error: 'Beneficiary not found' }, { status: 404 });

  const noticeLabel = NOTICE_TYPE_LABELS[notice.notice_type] || notice.notice_type;
  const beneficiaryName = `${beneficiary.first_name} ${beneficiary.last_name}`;
  const dueDateStr = formatDate(notice.due_date);
  const noticeContent = buildNoticeContent(notice.notice_type, beneficiary, qualifyingEvent, client);

  const adminEmailBody = `
<html><body style="font-family: Arial, sans-serif; font-size: 13px; color: #222; max-width: 760px; margin: auto; padding: 24px;">
  <div style="background: #1e3a5f; color: white; padding: 16px 24px; border-radius: 6px 6px 0 0;">
    <h2 style="margin:0;">COBRA Administration — Notice for Printing / Mailing</h2>
    <p style="margin:4px 0 0; opacity:0.8;">Generated ${formatDate(new Date().toISOString().split('T')[0])}</p>
  </div>
  <div style="border: 1px solid #ddd; border-top: none; padding: 24px; border-radius: 0 0 6px 6px;">
    <table style="width:100%; margin-bottom: 20px; border-collapse: collapse;">
      <tr><td style="padding:6px 12px 6px 0;font-weight:bold;color:#555;width:160px;">Notice Type</td><td>${noticeLabel}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;font-weight:bold;color:#555;">Beneficiary</td><td>${beneficiaryName}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;font-weight:bold;color:#555;">Client</td><td>${client?.company_name || beneficiary.client_name || ''}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;font-weight:bold;color:#555;">Legal Due Date</td><td>${dueDateStr}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
    <h3 style="margin:0 0 12px;color:#1e3a5f;">Notice Text (Print & Mail to Beneficiary)</h3>
    <pre style="white-space:pre-wrap;font-family:'Courier New',monospace;font-size:12px;background:#f8f9fa;border:1px solid #e0e0e0;padding:20px;border-radius:4px;line-height:1.6;">${noticeContent}</pre>
    <p style="margin-top:20px;color:#666;font-size:12px;">
      This notice has been generated in compliance with ERISA Section 606 and DOL COBRA regulations (29 CFR Part 2590). 
      Please print, sign, and mail to the beneficiary. Retain a copy with proof of mailing for your records.
    </p>
  </div>
</body></html>`;

  const clientEmailBody = `
<html><body style="font-family: Arial, sans-serif; font-size: 13px; color: #222; max-width: 680px; margin: auto; padding: 24px;">
  <div style="background: #1e3a5f; color: white; padding: 16px 24px; border-radius: 6px 6px 0 0;">
    <h2 style="margin:0;">COBRA Notice Notification</h2>
  </div>
  <div style="border: 1px solid #ddd; border-top: none; padding: 24px; border-radius: 0 0 6px 6px;">
    <p>Dear ${client?.contact_name || 'Plan Contact'},</p>
    <p>This is to notify you that the following COBRA notice is being prepared for mailing to the referenced beneficiary in accordance with federal COBRA continuation coverage requirements (ERISA § 606).</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f8f9fa;border-radius:4px;">
      <tr><td style="padding:10px 16px;font-weight:bold;color:#555;width:180px;border-bottom:1px solid #eee;">Notice Type</td><td style="padding:10px 16px;border-bottom:1px solid #eee;">${noticeLabel}</td></tr>
      <tr><td style="padding:10px 16px;font-weight:bold;color:#555;border-bottom:1px solid #eee;">Beneficiary</td><td style="padding:10px 16px;border-bottom:1px solid #eee;">${beneficiaryName}</td></tr>
      <tr><td style="padding:10px 16px;font-weight:bold;color:#555;border-bottom:1px solid #eee;">Mailing Address</td><td style="padding:10px 16px;border-bottom:1px solid #eee;">${beneficiary.address || ''}<br/>${beneficiary.city ? beneficiary.city + ', ' : ''}${beneficiary.state || ''} ${beneficiary.zip || ''}</td></tr>
      <tr><td style="padding:10px 16px;font-weight:bold;color:#555;">Legal Due Date</td><td style="padding:10px 16px;">${dueDateStr}</td></tr>
    </table>
    <p>No action is required from you at this time. Please retain this notification for your records.</p>
  </div>
</body></html>`;

  const results = { adminSent: false, clientSent: false };

  const effectiveAdminEmail = adminEmail || user.email;
  if (effectiveAdminEmail) {
    await base44.integrations.Core.SendEmail({
      to: effectiveAdminEmail,
      subject: `[COBRA Notice] ${noticeLabel} — ${beneficiaryName} (${client?.company_name || ''}) — Due ${dueDateStr}`,
      body: adminEmailBody,
    });
    results.adminSent = true;
  }

  if (client?.contact_email) {
    await base44.integrations.Core.SendEmail({
      to: client.contact_email,
      subject: `COBRA Notice Being Mailed: ${noticeLabel} for ${beneficiaryName}`,
      body: clientEmailBody,
    });
    results.clientSent = true;
  }

  return Response.json(results);
});