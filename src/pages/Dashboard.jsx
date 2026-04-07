import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, Users, CalendarClock, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import DeadlinesList from '@/components/dashboard/DeadlinesList';
import RecentActivity from '@/components/dashboard/RecentActivity';
import PageHeader from '@/components/shared/PageHeader';
import { useSubscription } from '@/lib/SubscriptionContext';

export default function Dashboard() {
  const { tenantSettings, isAgency } = useSubscription();
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });
  const { data: beneficiaries = [] } = useQuery({ queryKey: ['beneficiaries'], queryFn: () => base44.entities.Beneficiary.list() });
  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => base44.entities.QualifyingEvent.list() });
  const { data: notices = [] } = useQuery({ queryKey: ['notices'], queryFn: () => base44.entities.CobraNotice.list() });
  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: () => base44.entities.Payment.list() });

  const activeClients = clients.filter(c => c.status === 'active').length;
  const activeBeneficiaries = beneficiaries.filter(b => ['elected', 'active'].includes(b.cobra_status)).length;
  const pendingEvents = events.filter(e => ['reported', 'processing'].includes(e.status)).length;
  const overdueNotices = notices.filter(n => n.status === 'overdue').length;
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const totalReceived = payments.filter(p => p.status === 'received').reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {isAgency && tenantSettings?.logo_url && (
        <div className="flex items-center gap-3 mb-4">
          <img src={tenantSettings.logo_url} alt="Logo" className="h-10 object-contain" />
          {tenantSettings?.company_name && <span className="text-lg font-semibold">{tenantSettings.company_name}</span>}
        </div>
      )}
      <PageHeader 
        title="Dashboard" 
        description="Overview of your COBRA administration activity"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard title="Active Clients" value={activeClients} icon={Building2} color="primary" />
        <StatCard title="Active QBs" value={activeBeneficiaries} icon={Users} color="green" />
        <StatCard title="Pending Events" value={pendingEvents} icon={CalendarClock} color="amber" />
        <StatCard title="Overdue Notices" value={overdueNotices} icon={AlertTriangle} color="red" />
        <StatCard title="Pending Payments" value={pendingPayments} icon={DollarSign} color="blue" />
        <StatCard title="Collected" value={`$${totalReceived.toLocaleString()}`} icon={CheckCircle} color="green" />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeadlinesList notices={notices} />
        <RecentActivity events={events} />
      </div>
    </div>
  );
}