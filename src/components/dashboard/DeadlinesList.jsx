import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';

export default function DeadlinesList({ notices }) {
  const upcomingNotices = notices
    .filter(n => n.status === 'pending' || n.status === 'overdue')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 8);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingNotices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No upcoming deadlines</p>
        ) : (
          <div className="space-y-3">
            {upcomingNotices.map((notice) => {
              const daysUntil = differenceInDays(new Date(notice.due_date), new Date());
              const isOverdue = isPast(new Date(notice.due_date));
              return (
                <div key={notice.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{notice.beneficiary_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{notice.notice_type?.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    {isOverdue ? (
                      <Badge variant="destructive" className="text-xs gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Overdue
                      </Badge>
                    ) : daysUntil <= 3 ? (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">{daysUntil}d left</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">{format(new Date(notice.due_date), 'MMM d')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}