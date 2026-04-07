import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/shared/StatusBadge';
import NoticeViewer from '@/components/notices/NoticeViewer';

const NOTICE_TYPE_LABELS = {
  general_rights: 'General Rights Notice',
  election: 'Election Notice',
  unavailability: 'Unavailability Notice',
  early_termination: 'Early Termination Notice',
  insufficient_payment: 'Insufficient Payment Notice',
  conversion: 'Conversion Notice',
};

function fmt(d) {
  if (!d) return '—';
  try { return format(new Date(d), 'MMM d, yyyy'); } catch { return d; }
}

export default function NoticeDetail() {
  const { id } = useParams();

  const { data: notices = [] } = useQuery({ queryKey: ['notices'], queryFn: () => base44.entities.CobraNotice.list() });
  const { data: beneficiaries = [] } = useQuery({ queryKey: ['beneficiaries'], queryFn: () => base44.entities.Beneficiary.list() });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });
  const { data: qualifyingEvents = [] } = useQuery({ queryKey: ['qualifying_events'], queryFn: () => base44.entities.QualifyingEvent.list() });

  const notice = notices.find(n => n.id === id);
  const beneficiary = notice ? beneficiaries.find(b => b.id === notice.beneficiary_id) : null;
  const client = notice ? clients.find(c => c.id === notice.client_id) : null;
  const qualifyingEvent = notice ? qualifyingEvents.find(e => e.id === notice.qualifying_event_id) : null;

  if (!notice) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <Link to="/notices" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Notices
        </Link>
        <p className="text-muted-foreground">Notice not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Link to="/notices" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Notices
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {NOTICE_TYPE_LABELS[notice.notice_type] || notice.notice_type}
            </h1>
            <p className="text-sm text-muted-foreground">
              {notice.beneficiary_name} — {notice.client_name}
            </p>
          </div>
        </div>
        <StatusBadge status={notice.status} />
      </div>

      {/* Meta info */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Due Date</p>
              <p className="font-medium">{fmt(notice.due_date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Sent Date</p>
              <p className="font-medium">{fmt(notice.sent_date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Delivery Method</p>
              <p className="font-medium capitalize">{notice.delivery_method?.replace(/_/g, ' ') || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Election Deadline</p>
              <p className="font-medium">{fmt(notice.election_deadline)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notice Document */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Notice Document</CardTitle>
          <p className="text-xs text-muted-foreground">
            DOL-compliant notice — populated with beneficiary information. Print and mail to beneficiary.
          </p>
        </CardHeader>
        <CardContent>
          {beneficiary ? (
            <NoticeViewer
              notice={notice}
              beneficiary={beneficiary}
              qualifyingEvent={qualifyingEvent}
              client={client}
            />
          ) : (
            <p className="text-muted-foreground text-sm">Loading beneficiary data...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}