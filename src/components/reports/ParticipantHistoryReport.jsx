import { Card } from '@/components/ui/card';
import StatusBadge from '@/components/shared/StatusBadge';
import ReportToolbar from './ReportToolbar';

const fmt = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtMoney = (n) => n != null ? `$${Number(n).toFixed(2)}` : '—';
const fmtDateTime = (date, time) => {
  if (!date) return '—';
  const d = fmt(date);
  return time ? `${d} at ${time}` : d;
};

const EVENT_LABELS = {
  termination: 'Termination',
  reduction_in_hours: 'Reduction in Hours',
  death_of_employee: 'Death of Employee',
  divorce: 'Divorce',
  medicare_entitlement: 'Medicare Entitlement',
  loss_of_dependent_status: 'Loss of Dependent Status',
  employer_bankruptcy: 'Employer Bankruptcy',
};

const STATUS_LABELS = {
  pending_event: 'Pending Event',
  notice_sent: 'Notice Sent',
  elected: 'Elected',
  declined: 'Declined',
  active: 'Active',
  terminated: 'Terminated',
  expired: 'Expired',
};

const DELIVERY_LABELS = {
  first_class_mail: 'First Class Mail',
  certified_mail: 'Certified Mail',
  email: 'Email',
  hand_delivered: 'Hand Delivered',
  fax: 'Fax',
  other: 'Other',
};

const ACTIVITY_ICONS = {
  status_change: '🔄',
  notice_sent: '📬',
  payment_received: '💰',
  note_added: '📝',
  document_uploaded: '📎',
};

function ActivityLogEntry({ log }) {
  const icon = ACTIVITY_ICONS[log.activity_type] || '•';
  const isStatusChange = log.activity_type === 'status_change';

  let title = '';
  if (isStatusChange) {
    const prev = STATUS_LABELS[log.previous_status] || log.previous_status || '—';
    const next = STATUS_LABELS[log.new_status] || log.new_status || '—';
    title = `Status Changed: ${prev} → ${next}`;
  } else {
    title = log.activity_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Activity';
  }

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <span className="text-base mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
          <span className="text-xs text-muted-foreground">{fmtDateTime(log.activity_date, log.activity_time)}</span>
          {log.delivery_method && (
            <span className="text-xs text-muted-foreground">via {DELIVERY_LABELS[log.delivery_method] || log.delivery_method}</span>
          )}
          {log.logged_by && (
            <span className="text-xs text-muted-foreground">by {log.logged_by}</span>
          )}
        </div>
        {log.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{log.notes}"</p>}
        {log.document_url && (
          <a
            href={log.document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary underline mt-1 inline-block"
          >
            📎 {log.document_name || 'View Document'}
          </a>
        )}
      </div>
    </div>
  );
}

export default function ParticipantHistoryReport({ data }) {
  const { beneficiaries, events, notices, payments, activityLogs = [], clientName } = data;

  const csvHeaders = [
    'Name', 'Client', 'Relationship', 'Coverage Type', 'COBRA Status',
    'COBRA Start', 'COBRA End', 'Monthly Premium', 'Qualifying Event', 'Event Date',
    'Notices Sent', 'Payments Received', 'Total Collected',
  ];
  const csvRows = beneficiaries.map(b => {
    const bEvents = events.filter(e => e.beneficiary_id === b.id);
    const bNotices = notices.filter(n => n.beneficiary_id === b.id);
    const bPayments = payments.filter(p => p.beneficiary_id === b.id && p.status === 'received');
    const totalCollected = bPayments.reduce((s, p) => s + (p.amount || 0), 0);
    return [
      `${b.first_name} ${b.last_name}`,
      b.client_name,
      b.relationship,
      (b.coverage_type || '').replace(/_/g, ' + '),
      b.cobra_status,
      b.cobra_start_date || '',
      b.cobra_end_date || '',
      b.monthly_premium || '',
      bEvents.map(e => EVENT_LABELS[e.event_type] || e.event_type).join('; '),
      bEvents.map(e => e.event_date).join('; '),
      bNotices.filter(n => n.status === 'sent' || n.status === 'completed').length,
      bPayments.length,
      totalCollected.toFixed(2),
    ];
  });

  return (
    <div>
      <ReportToolbar
        title="Participant History"
        clientName={clientName}
        csvHeaders={csvHeaders}
        csvRows={csvRows}
        csvFilename="participant-history-report.csv"
      />

      <div id="report-printable">
        <h1 style={{ fontFamily: 'sans-serif', marginBottom: 4 }}>Participant History Report</h1>
        <h2 style={{ fontFamily: 'sans-serif', color: '#555', fontWeight: 'normal', fontSize: 14, marginBottom: 16 }}>{clientName} &mdash; Generated {new Date().toLocaleDateString()}</h2>

        <div className="space-y-6">
          {beneficiaries.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No participants found</p>
          ) : beneficiaries.map(b => {
            const bEvents = events.filter(e => e.beneficiary_id === b.id);
            const bNotices = notices.filter(n => n.beneficiary_id === b.id);
            const bPayments = payments.filter(p => p.beneficiary_id === b.id);
            const totalCollected = bPayments.filter(p => p.status === 'received').reduce((s, p) => s + (p.amount || 0), 0);
            const bLogs = activityLogs
              .filter(l => l.beneficiary_id === b.id)
              .sort((a, b) => {
                const da = new Date(`${a.activity_date}T${a.activity_time || '00:00'}`);
                const db = new Date(`${b.activity_date}T${b.activity_time || '00:00'}`);
                return db - da;
              });

            return (
              <Card key={b.id} className="p-5">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4 pb-4 border-b border-border">
                  <div>
                    <h3 className="font-bold text-base">{b.first_name} {b.last_name}</h3>
                    <p className="text-sm text-muted-foreground">{b.client_name} &mdash; <span className="capitalize">{b.relationship}</span></p>
                  </div>
                  <StatusBadge status={b.cobra_status} />
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div><p className="text-xs text-muted-foreground">Coverage Type</p><p className="font-medium capitalize">{(b.coverage_type || '—').replace(/_/g, ' + ')}</p></div>
                  <div><p className="text-xs text-muted-foreground">COBRA Start</p><p className="font-medium">{fmt(b.cobra_start_date)}</p></div>
                  <div><p className="text-xs text-muted-foreground">COBRA End</p><p className="font-medium">{fmt(b.cobra_end_date)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Monthly Premium</p><p className="font-medium">{fmtMoney(b.monthly_premium ? b.monthly_premium * 1.02 : null)} <span className="text-xs text-muted-foreground">(102%)</span></p></div>
                </div>

                {/* Qualifying Events */}
                {bEvents.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Qualifying Events</p>
                    <div className="space-y-1">
                      {bEvents.map(e => (
                        <div key={e.id} className="flex items-center gap-3 text-sm">
                          <span className="font-medium">{EVENT_LABELS[e.event_type] || e.event_type}</span>
                          <span className="text-muted-foreground">{fmt(e.event_date)}</span>
                          <StatusBadge status={e.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notices summary */}
                <div className="flex flex-wrap gap-6 text-sm border-t border-border pt-3 mt-3">
                  <div><span className="text-muted-foreground">Notices: </span><span className="font-medium">{bNotices.length} total, {bNotices.filter(n => n.status === 'sent' || n.status === 'completed').length} sent</span></div>
                  <div><span className="text-muted-foreground">Payments Received: </span><span className="font-medium">{bPayments.filter(p => p.status === 'received').length}</span></div>
                  <div><span className="text-muted-foreground">Total Collected: </span><span className="font-semibold text-emerald-600">{fmtMoney(totalCollected)}</span></div>
                  {bPayments.some(p => p.status === 'missed') && (
                    <div><span className="text-muted-foreground">Missed Payments: </span><span className="font-semibold text-red-600">{bPayments.filter(p => p.status === 'missed').length}</span></div>
                  )}
                </div>

                {/* Activity Log */}
                {bLogs.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Activity Log</p>
                    <div>
                      {bLogs.map(log => (
                        <ActivityLogEntry key={log.id} log={log} />
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}