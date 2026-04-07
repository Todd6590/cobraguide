import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/shared/StatusBadge';
import ReportToolbar from './ReportToolbar';
import { addDays, isBefore, isAfter, parseISO } from 'date-fns';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const NOTICE_LABELS = {
  general_rights: 'General Rights',
  election: 'Election Notice',
  unavailability: 'Unavailability',
  early_termination: 'Early Termination',
  insufficient_payment: 'Insufficient Payment',
  conversion: 'Conversion Notice',
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
};

const urgencyClass = (days) => {
  if (days <= 5) return 'text-red-600 font-bold';
  if (days <= 10) return 'text-amber-600 font-semibold';
  return 'text-foreground';
};

export default function UpcomingDeadlinesReport({ data }) {
  const { notices, events, clientName } = data;

  const today = new Date();
  const in30 = addDays(today, 30);

  const upcomingNotices = notices.filter(n => {
    if (n.status === 'sent' || n.status === 'completed') return false;
    if (!n.due_date) return false;
    const d = new Date(n.due_date);
    return !isBefore(d, today) && !isAfter(d, in30);
  }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const upcomingElections = notices.filter(n => {
    if (!n.election_deadline) return false;
    const d = new Date(n.election_deadline);
    return !isBefore(d, today) && !isAfter(d, in30);
  }).sort((a, b) => new Date(a.election_deadline) - new Date(b.election_deadline));

  const csvHeaders = ['Type', 'Beneficiary', 'Client', 'Deadline', 'Days Until Due', 'Notice Type / Detail'];
  const csvRows = [
    ...upcomingNotices.map(n => ['Notice Due', n.beneficiary_name, n.client_name, n.due_date, daysUntil(n.due_date), NOTICE_LABELS[n.notice_type] || n.notice_type]),
    ...upcomingElections.map(n => ['Election Deadline', n.beneficiary_name, n.client_name, n.election_deadline, daysUntil(n.election_deadline), NOTICE_LABELS[n.notice_type] || n.notice_type]),
  ];

  return (
    <div>
      <ReportToolbar
        title="Upcoming Deadlines (Next 30 Days)"
        clientName={clientName}
        csvHeaders={csvHeaders}
        csvRows={csvRows}
        csvFilename="upcoming-deadlines-report.csv"
      />

      <div id="report-printable">
        <h1 style={{ fontFamily: 'sans-serif', marginBottom: 4 }}>Upcoming Deadlines — Next 30 Days</h1>
        <h2 style={{ fontFamily: 'sans-serif', color: '#555', fontWeight: 'normal', fontSize: 14, marginBottom: 16 }}>{clientName} &mdash; Generated {new Date().toLocaleDateString()}</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-2xl font-bold text-amber-600">{upcomingNotices.length}</p>
            <p className="text-xs text-muted-foreground">Notices Due</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-blue-600">{upcomingElections.length}</p>
            <p className="text-xs text-muted-foreground">Election Deadlines</p>
          </Card>
        </div>

        {/* Notices Due */}
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Notices Due</p>
        <Card className="mb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Beneficiary</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Notice Type</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Days Until Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingNotices.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No notices due in the next 30 days</TableCell></TableRow>
              ) : upcomingNotices.map(n => {
                const days = daysUntil(n.due_date);
                return (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">{n.beneficiary_name}</TableCell>
                    <TableCell className="text-sm">{n.client_name}</TableCell>
                    <TableCell className="text-sm">{NOTICE_LABELS[n.notice_type] || n.notice_type}</TableCell>
                    <TableCell className="text-sm">{fmt(n.due_date)}</TableCell>
                    <TableCell className={`text-sm ${urgencyClass(days)}`}>{days === 0 ? 'Today' : `${days} day${days !== 1 ? 's' : ''}`}</TableCell>
                    <TableCell><StatusBadge status={n.status} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Election Deadlines */}
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Election Deadlines</p>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Beneficiary</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Notice Type</TableHead>
                <TableHead>Election Deadline</TableHead>
                <TableHead>Days Until Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingElections.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No election deadlines in the next 30 days</TableCell></TableRow>
              ) : upcomingElections.map(n => {
                const days = daysUntil(n.election_deadline);
                return (
                  <TableRow key={`elec-${n.id}`}>
                    <TableCell className="font-medium">{n.beneficiary_name}</TableCell>
                    <TableCell className="text-sm">{n.client_name}</TableCell>
                    <TableCell className="text-sm">{NOTICE_LABELS[n.notice_type] || n.notice_type}</TableCell>
                    <TableCell className="text-sm">{fmt(n.election_deadline)}</TableCell>
                    <TableCell className={`text-sm ${urgencyClass(days)}`}>{days === 0 ? 'Today' : `${days} day${days !== 1 ? 's' : ''}`}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}