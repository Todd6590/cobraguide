import { base44 } from '@/api/base44Client';
import { buildNoticeContent, NOTICE_TYPE_LABELS } from './cobraUtils';
import { format } from 'date-fns';

/**
 * Send the notice as HTML email to the admin AND a notification email to the client contact.
 * Returns { adminSent: bool, clientSent: bool, error: string|null }
 */
export async function sendNoticeEmails({ notice, beneficiary, qualifyingEvent, client, adminEmail }) {
  const noticeContent = buildNoticeContent(
    notice.notice_type,
    beneficiary,
    qualifyingEvent,
    client
  );

  const noticeLabel = NOTICE_TYPE_LABELS[notice.notice_type] || notice.notice_type;
  const beneficiaryName = `${beneficiary.first_name} ${beneficiary.last_name}`;
  const dueDateStr = notice.due_date ? format(new Date(notice.due_date), 'MMMM d, yyyy') : 'N/A';

  // Build HTML email body for admin — full notice text
  const adminEmailBody = `
<html>
<body style="font-family: Arial, sans-serif; font-size: 13px; color: #222; max-width: 760px; margin: auto; padding: 24px;">
  <div style="background: #1e3a5f; color: white; padding: 16px 24px; border-radius: 6px 6px 0 0;">
    <h2 style="margin:0;">COBRA Administration — Notice for Printing / Mailing</h2>
    <p style="margin:4px 0 0; opacity:0.8;">Generated ${format(new Date(), 'MMMM d, yyyy')}</p>
  </div>
  <div style="border: 1px solid #ddd; border-top: none; padding: 24px; border-radius: 0 0 6px 6px;">
    <table style="width:100%; margin-bottom: 20px; border-collapse: collapse;">
      <tr>
        <td style="padding: 6px 12px 6px 0; font-weight:bold; color:#555; width:160px;">Notice Type</td>
        <td style="padding: 6px 0;">${noticeLabel}</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px 6px 0; font-weight:bold; color:#555;">Beneficiary</td>
        <td style="padding: 6px 0;">${beneficiaryName}</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px 6px 0; font-weight:bold; color:#555;">Client</td>
        <td style="padding: 6px 0;">${client?.company_name || beneficiary.client_name}</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px 6px 0; font-weight:bold; color:#555;">Legal Due Date</td>
        <td style="padding: 6px 0;">${dueDateStr}</td>
      </tr>
    </table>
    <hr style="border:none; border-top:1px solid #eee; margin: 16px 0;" />
    <h3 style="margin: 0 0 12px; color: #1e3a5f;">Notice Text (Print & Mail to Beneficiary)</h3>
    <pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 12px; background: #f8f9fa; border: 1px solid #e0e0e0; padding: 20px; border-radius: 4px; line-height: 1.6;">${noticeContent}</pre>
    <p style="margin-top: 20px; color: #666; font-size: 12px;">
      This notice has been generated in compliance with ERISA Section 606 and the DOL COBRA regulations (29 CFR Part 2590). 
      Please print, sign, and mail to the beneficiary using the method indicated. Retain a copy with proof of mailing for your records.
    </p>
  </div>
</body>
</html>
  `;

  // Notification email for client contact
  const clientEmailBody = `
<html>
<body style="font-family: Arial, sans-serif; font-size: 13px; color: #222; max-width: 680px; margin: auto; padding: 24px;">
  <div style="background: #1e3a5f; color: white; padding: 16px 24px; border-radius: 6px 6px 0 0;">
    <h2 style="margin:0;">COBRA Notice Notification</h2>
  </div>
  <div style="border: 1px solid #ddd; border-top: none; padding: 24px; border-radius: 0 0 6px 6px;">
    <p>Dear ${client?.contact_name || 'Plan Contact'},</p>
    <p>
      This is to notify you that the following COBRA notice is being prepared for mailing to the referenced beneficiary 
      in accordance with federal COBRA continuation coverage requirements (ERISA § 606).
    </p>
    <table style="width:100%; border-collapse: collapse; margin: 16px 0; background: #f8f9fa; border-radius: 4px;">
      <tr>
        <td style="padding: 10px 16px; font-weight:bold; color:#555; width:180px; border-bottom:1px solid #eee;">Notice Type</td>
        <td style="padding: 10px 16px; border-bottom:1px solid #eee;">${noticeLabel}</td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; font-weight:bold; color:#555; border-bottom:1px solid #eee;">Beneficiary</td>
        <td style="padding: 10px 16px; border-bottom:1px solid #eee;">${beneficiaryName}</td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; font-weight:bold; color:#555; border-bottom:1px solid #eee;">Mailing Address</td>
        <td style="padding: 10px 16px; border-bottom:1px solid #eee;">
          ${beneficiary.address || ''}<br/>
          ${beneficiary.city ? beneficiary.city + ', ' : ''}${beneficiary.state || ''} ${beneficiary.zip || ''}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; font-weight:bold; color:#555;">Legal Due Date</td>
        <td style="padding: 10px 16px;">${dueDateStr}</td>
      </tr>
    </table>
    <p>
      No action is required from you at this time. Please retain this notification for your records. 
      The notice is being sent on behalf of <strong>${client?.company_name || 'your organization'}</strong> 
      by the COBRA administrator.
    </p>
    <p style="color:#666;">
      Questions? Contact your COBRA administrator.
    </p>
  </div>
</body>
</html>
  `;

  const results = { adminSent: false, clientSent: false, error: null };

  // Send to admin
  if (adminEmail) {
    await base44.integrations.Core.SendEmail({
      to: adminEmail,
      subject: `[COBRA Notice] ${noticeLabel} — ${beneficiaryName} (${client?.company_name || ''}) — Due ${dueDateStr}`,
      body: adminEmailBody,
    });
    results.adminSent = true;
  }

  // Send to client contact
  if (client?.contact_email) {
    await base44.integrations.Core.SendEmail({
      to: client.contact_email,
      subject: `COBRA Notice Being Mailed: ${noticeLabel} for ${beneficiaryName}`,
      body: clientEmailBody,
    });
    results.clientSent = true;
  }

  return results;
}