import { Badge } from '@/components/ui/badge';

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-gray-50 text-gray-600 border-gray-200',
  onboarding: 'bg-blue-50 text-blue-700 border-blue-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  pending_event: 'bg-gray-50 text-gray-600 border-gray-200',
  notice_sent: 'bg-blue-50 text-blue-700 border-blue-200',
  elected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  declined: 'bg-red-50 text-red-600 border-red-200',
  terminated: 'bg-red-50 text-red-600 border-red-200',
  expired: 'bg-gray-50 text-gray-500 border-gray-200',
  reported: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  election_pending: 'bg-amber-50 text-amber-700 border-amber-200',
  closed: 'bg-gray-50 text-gray-500 border-gray-200',
  sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue: 'bg-red-50 text-red-600 border-red-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  received: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  late: 'bg-amber-50 text-amber-700 border-amber-200',
  missed: 'bg-red-50 text-red-600 border-red-200',
  grace_period: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-gray-50 text-gray-600 border-gray-200';
  const label = (status || 'unknown').replace(/_/g, ' ');
  
  return (
    <Badge variant="outline" className={`${style} capitalize text-xs font-medium`}>
      {label}
    </Badge>
  );
}