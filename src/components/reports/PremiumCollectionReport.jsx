import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/shared/StatusBadge';
import ReportToolbar from './ReportToolbar';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtMoney = (n) => n != null ? `$${Number(n).toFixed(2)}` : '—';

export default function PremiumCollectionReport({ data }) {
  const { payments, clientName } = data;

  const totalBilled = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalReceived = payments.filter(p => p.status === 'received').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);
  const totalMissed = payments.filter(p => p.status === 'missed' || p.status === 'late').reduce((s, p) => s + (p.amount || 0), 0);

  const csvHeaders = ['Beneficiary', 'Client', 'Period', 'Amount', 'Due Date', 'Received Date', 'Status', 'Method', 'Reference'];
  const csvRows = payments.map(p => [
    p.beneficiary_name,
    p.client_name,
    `${p.period_start || ''} - ${p.period_end || ''}`,
    p.amount,
    p.due_date,
    p.received_date || '',
    p.status,
    (p.payment_method || '').replace(/_/g, ' '),
    p.reference_number || '',
  ]);

  return (
    <div>
      <ReportToolbar
        title="Premium Collection Summary"
        clientName={clientName}
        csvHeaders={csvHeaders}
        csvRows={csvRows}
        csvFilename="premium-collection-report.csv"
      />

      <div id="report-printable">
        <h1 style={{ fontFamily: 'sans-serif', marginBottom: 4 }}>Premium Collection Summary</h1>
        <h2 style={{ fontFamily: 'sans-serif', color: '#555', fontWeight: 'normal', fontSize: 14, marginBottom: 16 }}>{clientName} &mdash; Generated {new Date().toLocaleDateString()}</h2>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Billed', value: fmtMoney(totalBilled), color: 'text-foreground' },
            { label: 'Collected', value: fmtMoney(totalReceived), color: 'text-emerald-600' },
            { label: 'Pending', value: fmtMoney(totalPending), color: 'text-amber-600' },
            { label: 'Missed / Late', value: fmtMoney(totalMissed), color: 'text-red-600' },
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
                <TableHead>Coverage Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Received Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No payments found</TableCell></TableRow>
              ) : payments.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.beneficiary_name}</TableCell>
                  <TableCell className="text-sm">{p.client_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmt(p.period_start)} – {fmt(p.period_end)}</TableCell>
                  <TableCell className="text-sm font-medium">{fmtMoney(p.amount)}</TableCell>
                  <TableCell className="text-sm">{fmt(p.due_date)}</TableCell>
                  <TableCell className="text-sm">{fmt(p.received_date)}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-sm capitalize">{(p.payment_method || '—').replace(/_/g, ' ')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}