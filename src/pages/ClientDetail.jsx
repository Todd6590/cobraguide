import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Users, CalendarClock, Mail, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/shared/StatusBadge';
import { format } from 'date-fns';

export default function ClientDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = window.location.pathname.split('/').pop();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0];
    },
  });

  const { data: beneficiaries = [] } = useQuery({
    queryKey: ['client-beneficiaries', clientId],
    queryFn: () => base44.entities.Beneficiary.filter({ client_id: clientId }),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['client-events', clientId],
    queryFn: () => base44.entities.QualifyingEvent.filter({ client_id: clientId }),
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!client) return <div className="p-8 text-center text-muted-foreground">Client not found</div>;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <Link to="/clients" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{client.company_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={client.status} />
            {client.ein && <span className="text-xs text-muted-foreground">EIN: {client.ein}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Contact</p>
          <p className="font-medium mt-1">{client.contact_name || '—'}</p>
          <p className="text-sm text-muted-foreground">{client.contact_email}</p>
          <p className="text-sm text-muted-foreground">{client.contact_phone}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Address</p>
          <p className="font-medium mt-1">{client.address || '—'}</p>
          <p className="text-sm text-muted-foreground">{[client.city, client.state, client.zip].filter(Boolean).join(', ')}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Plan Details</p>
          <p className="font-medium mt-1 capitalize">{client.plan_type?.replace(/_/g, ' + ') || '—'}</p>
          <p className="text-sm text-muted-foreground">{client.employee_count || 0} employees</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Beneficiaries ({beneficiaries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {beneficiaries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No beneficiaries yet</p>
            ) : (
              <div className="space-y-2">
                {beneficiaries.map(b => (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{b.first_name} {b.last_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{b.relationship}</p>
                    </div>
                    <StatusBadge status={b.cobra_status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primary" /> Qualifying Events ({events.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No qualifying events</p>
            ) : (
              <div className="space-y-2">
                {events.map(e => (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{e.beneficiary_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{e.event_type?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={e.status} />
                      <p className="text-xs text-muted-foreground mt-1">
                        {e.event_date ? format(new Date(e.event_date), 'MMM d, yyyy') : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {client.notes && (
        <Card className="mt-6 p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
          <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
        </Card>
      )}
    </div>
  );
}