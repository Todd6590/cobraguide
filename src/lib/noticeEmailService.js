import { base44 } from '@/api/base44Client';

/**
 * Send the notice emails via the backend function (server-side).
 * Returns { adminSent: bool, clientSent: bool }
 */
export async function sendNoticeEmails({ notice, adminEmail }) {
  const response = await base44.functions.invoke('sendNoticeEmail', {
    noticeId: notice.id,
    adminEmail: adminEmail || null,
  });
  return response.data || { adminSent: false, clientSent: false };
}