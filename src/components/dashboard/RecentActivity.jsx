import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function RecentActivity({ events }) {
  const recentEvents = [...events]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 8);

  const eventLabels = {
    termination: 'Termination',
    reduction_in_hours: 'Reduction in Hours',
    death_of_employee: 'Death of Employee',
    divorce: 'Divorce/Legal Separation',
    medicare_entitlement: 'Medicare Entitlement',
    loss_of_dependent_status: 'Loss of Dependent Status',
    employer_bankruptcy: 'Employer Bankruptcy',
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Recent Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No recent events</p>
        ) : (
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{event.beneficiary_name}</p>
                  <p className="text-xs text-muted-foreground">{eventLabels[event.event_type] || event.event_type}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <span className="text-xs text-muted-foreground">
                    {event.event_date ? format(new Date(event.event_date), 'MMM d, yyyy') : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}