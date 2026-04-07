import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/shared/StatusBadge';
import ReportToolbar from './ReportToolbar';

const NOTICE_LABELS = {
  general_rights: 'General Rights',
  election: 'Election Notice',
  unavailability: 'Unavailability',
  early_termination: 'Early Termination',
  insufficient_payment: 'Insufficient Payment',
  conversion: 'Conversion Notice',
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function NoticeActivityReport({ data }) {
  const { notices, clientName } = data;

  const sent = notices.filter(n => n.status === 'sent' || n.status === 'completed').length;
  const pending = notices.filter(n => n.status === 'pending').length;
  const overdue = notices.filter(n => n.status === 'overdue').length;

  const csvHeaders = ['Beneficiary', 'Client', 'Notice Type', 'Due Date', 'Sent Date', 'Delivery Method', 'Status', 'Election Deadline'];
  const csvRows = notices.map(n => [
    n.beneficiary_name,
    n.client_name,
    NOTICE_LABELS[n.notice_type] || n.notice_type,
    n.due_date,
    n.sent_date || '',
    (n.delivery_method || '').replace(/_/g, ' '),
    n.status,
    n.election_deadline || '',
  ]);

  return (
    <div>
      <ReportToolbar
        title="Notice Activity Report"
        clientName={clientName}
        csvHeaders={csvHeaders}
        csvRows={csvRows}
        csvFilename="notice-activity-report.csv"
      />

      <div id="report-printable">
        <h1 style={{ fontFamily: 'sans-serif', marginBottom: 4 }}>Notice Activity Report</h1>
        <h2 style={{ fontFamily: 'sans-serif', color: '#555', fontWeight: 'normal', fontSize: 14, marginBottom: 16 }}>{clientName} &mdash; Generated {new Date().toLocaleDateString()}</h2>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Notices', value: notices.length, color: 'text-foreground' },
            { label: 'Sent / Completed', value: sent, color: 'text-emerald-600' },
            { label: 'Pending', value: pending, color: 'text-amber-600' },
          ].map(s => (
            <Card key={s.label} className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Beneficiary</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Notice Type</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Sent Date</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Election Deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notices.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No notices found</TableCell></TableRow>
              ) : notices.map(n => (
                <TableRow key={n.id}>
                  <TableCell className="font-medium">{n.beneficiary_name}</TableCell>
                  <TableCell className="text-sm">{n.client_name}</TableCell>
                  <TableCell className="text-sm">{NOTICE_LABELS[n.notice_type] || n.notice_type}</TableCell>
                  <TableCell className="text-sm">{fmt(n.due_date)}</TableCell>
                  <TableCell className="text-sm">{fmt(n.sent_date)}</TableCell>
                  <TableCell className="text-sm capitalize">{(n.delivery_method || '—').replace(/_/g, ' ')}</TableCell>
                  <TableCell><StatusBadge status={n.status} /></TableCell>
                  <TableCell className="text-sm">{fmt(n.election_deadline)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}