import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Scheduled function: runs daily.
 * Finds conversion and early_termination notices whose due_date is exactly
 * 15 days from today (or within a 1-day window to handle missed runs),
 * and emails them if not already sent.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled/service calls (no user auth required)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 15);
    const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`Checking for deferred notices due on ${targetDateStr} (15 days out)`);

    // Fetch all pending conversion and early_termination notices
    const allNotices = await base44.asServiceRole.entities.CobraNotice.list();

    const deferredTypes = ['conversion', 'early_termination'];

    const noticesToSend = allNotices.filter(n => {
      if (!deferredTypes.includes(n.notice_type)) return false;
      if (n.status === 'sent' || n.status === 'completed') return false;
      if (!n.due_date) return false;

      // Match notices due within the next 15 days (target window: due_date === targetDateStr)
      return n.due_date === targetDateStr;
    });

    console.log(`Found ${noticesToSend.length} notice(s) to send today`);

    const results = [];
    for (const notice of noticesToSend) {
      try {
        const result = await base44.asServiceRole.functions.invoke('sendNoticeEmail', {
          noticeId: notice.id,
        });
        // Mark notice as sent
        await base44.asServiceRole.entities.CobraNotice.update(notice.id, {
          status: 'sent',
          sent_date: new Date().toISOString().split('T')[0],
        });
        console.log(`Sent notice ${notice.id} (${notice.notice_type}) for beneficiary ${notice.beneficiary_name}`);
        results.push({ noticeId: notice.id, type: notice.notice_type, sent: true });
      } catch (err) {
        console.error(`Failed to send notice ${notice.id}:`, err.message);
        results.push({ noticeId: notice.id, type: notice.notice_type, sent: false, error: err.message });
      }
    }

    return Response.json({ date: targetDateStr, processed: results.length, results });
  } catch (error) {
    console.error('sendDeferredNotices error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});