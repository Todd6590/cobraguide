import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, FileText, AlertCircle } from 'lucide-react';
import { NOTICE_TYPE_LABELS } from '@/lib/cobraUtils';
import { format } from 'date-fns';

export default function NoticeGenerationStatus({ status, onClose }) {
  if (!status) return null;
  const { notices = [], emailResults = [] } = status;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Notices Generated Successfully
          </DialogTitle>
        </DialogHeader>

        {notices.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No new notices needed — all required notices for this event already exist.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {notices.length} notice{notices.length > 1 ? 's were' : ' was'} automatically created based on the qualifying event:
            </p>

            {emailResults.map(({ notice, adminSent, clientSent, error }, idx) => (
              <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">
                    {NOTICE_TYPE_LABELS[notice.notice_type] || notice.notice_type}
                  </span>
                  {notice.due_date && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      Due: {format(new Date(notice.due_date), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 pl-6 text-xs">
                  <span className={`flex items-center gap-1 ${adminSent ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    <Mail className="w-3 h-3" />
                    {adminSent ? 'Notice emailed to admin' : 'Admin email skipped'}
                  </span>
                  <span className={`flex items-center gap-1 ${clientSent ? 'text-emerald-600' : 'text-amber-600'}`}>
                    <Mail className="w-3 h-3" />
                    {clientSent ? 'Client notified' : 'No client email on file'}
                  </span>
                </div>

                {error && (
                  <div className="flex items-center gap-1 pl-6 text-xs text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    Email error: {error}
                  </div>
                )}
              </div>
            ))}

            <p className="text-xs text-muted-foreground pt-1">
              All notices have been saved and are visible on the Notices page. 
              The admin email contains the full printable notice text. 
              A separate notification was sent to the client contact.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}