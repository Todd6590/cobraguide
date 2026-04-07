import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EventFormDialog from '@/components/events/EventFormDialog';

const eventTypeLabels = {
  termination: 'Termination',
  reduction_in_hours: 'Reduction in Hours',
  death_of_employee: 'Death of Employee',
  divorce: 'Divorce/Legal Separation',
  medicare_entitlement: 'Medicare Entitlement',
  loss_of_dependent_status: 'Loss of Dependent Status',
  employer_bankruptcy: 'Employer Bankruptcy',
};

export default function QualifyingEvents() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({ queryKey: ['events'], queryFn: () => base44.entities.QualifyingEvent.list() });
  const { data: beneficiaries = [] } = useQuery({ queryKey: ['beneficiaries'], queryFn: () => base44.entities.Beneficiary.list() });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.QualifyingEvent.update(editing.id, data)
      : base44.entities.QualifyingEvent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setDialogOpen(false);
      setEditing(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.QualifyingEvent.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  const filtered = events.filter(e =>
    e.beneficiary_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.event_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Qualifying Events"
        description="Track and manage COBRA qualifying events"
        actions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Report Event
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Beneficiary</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Event Date</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No events found</TableCell></TableRow>
            ) : filtered.map(event => (
              <TableRow key={event.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{event.beneficiary_name || '—'}</TableCell>
                <TableCell className="text-sm">{event.client_name || '—'}</TableCell>
                <TableCell className="text-sm">{eventTypeLabels[event.event_type] || event.event_type}</TableCell>
                <TableCell className="text-sm">{event.event_date ? format(new Date(event.event_date), 'MMM d, yyyy') : '—'}</TableCell>
                <TableCell className="text-sm">{event.max_coverage_months || 18} months</TableCell>
                <TableCell><StatusBadge status={event.status} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditing(event); setDialogOpen(true); }}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(event.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <EventFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editing}
        beneficiaries={beneficiaries}
        clients={clients}
        onSave={(data) => saveMutation.mutate(data)}
        saving={saveMutation.isPending}
      />
    </div>
  );
}