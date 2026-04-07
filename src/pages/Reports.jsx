import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, DollarSign, Users, Bell, Download, Printer, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import NoticeActivityReport from '@/components/reports/NoticeActivityReport';
import PremiumCollectionReport from '@/components/reports/PremiumCollectionReport';
import ParticipantHistoryReport from '@/components/reports/ParticipantHistoryReport';
import UpcomingDeadlinesReport from '@/components/reports/UpcomingDeadlinesReport';

const REPORT_TYPES = [
  {
    id: 'notices',
    label: 'Notice Activity Report',
    description: 'What notices were sent, when, and to whom',
    icon: Bell,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 'premiums',
    label: 'Premium Collection Summary',
    description: 'Payment history, amounts collected, and outstanding balances',
    icon: DollarSign,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    id: 'participants',
    label: 'Participant History',
    description: 'Full COBRA history per beneficiary',
    icon: Users,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    id: 'deadlines',
    label: 'Upcoming Deadlines',
    description: 'Notices and elections due in the next 30 days',
    icon: FileText,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
];

export default function Reports() {
  const [activeReport, setActiveReport] = useState(null);
  const [clientFilter, setClientFilter] = useState('all');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: beneficiaries = [] } = useQuery({
    queryKey: ['beneficiaries'],
    queryFn: () => base44.entities.Beneficiary.list(),
  });

  const { data: notices = [] } = useQuery({
    queryKey: ['notices'],
    queryFn: () => base44.entities.CobraNotice.list(),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.QualifyingEvent.list(),
  });

  const filteredData = {
    clients,
    beneficiaries: clientFilter === 'all' ? beneficiaries : beneficiaries.filter(b => b.client_id === clientFilter),
    notices: clientFilter === 'all' ? notices : notices.filter(n => n.client_id === clientFilter),
    payments: clientFilter === 'all' ? payments : payments.filter(p => p.client_id === clientFilter),
    events: clientFilter === 'all' ? events : events.filter(e => e.client_id === clientFilter),
    clientName: clientFilter === 'all' ? 'All Clients' : clients.find(c => c.id === clientFilter)?.company_name || '',
  };

  const selectedReport = REPORT_TYPES.find(r => r.id === activeReport);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Employer Reports"
        description="Generate, print, and download COBRA administration reports"
      />

      {/* Report Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {REPORT_TYPES.map(report => {
          const Icon = report.icon;
          const isActive = activeReport === report.id;
          return (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                isActive
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/30 hover:shadow-sm'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg ${report.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${report.color}`} />
              </div>
              <p className="font-semibold text-sm text-foreground">{report.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      {activeReport && (
        <Card className="mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Filter by Client:</span>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      {!activeReport && (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Select a report above to get started</p>
        </div>
      )}

      {activeReport === 'notices' && <NoticeActivityReport data={filteredData} />}
      {activeReport === 'premiums' && <PremiumCollectionReport data={filteredData} />}
      {activeReport === 'participants' && <ParticipantHistoryReport data={filteredData} />}
      {activeReport === 'deadlines' && <UpcomingDeadlinesReport data={filteredData} />}
    </div>
  );
}