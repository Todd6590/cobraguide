import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Building2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import ClientFormDialog from '@/components/clients/ClientFormDialog';
import UpgradeDialog from '@/components/subscription/UpgradeDialog';
import { Link } from 'react-router-dom';
import { useSubscription } from '@/lib/SubscriptionContext';

export default function Clients() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();
  const { clientLimit, plan, isTrial, trialExpired } = useSubscription();

  const { data: clients = [], isLoading } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Client.update(editing.id, data)
      : base44.entities.Client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setDialogOpen(false);
      setEditing(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const filtered = clients.filter(c =>
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  const atLimit = trialExpired || (clientLimit > 0 && clients.length >= clientLimit);

  const handleAddClient = () => {
    if (atLimit) { setUpgradeOpen(true); return; }
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Clients"
        description="Manage your client companies"
        actions={
          <div className="flex items-center gap-2">
            {atLimit && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                {clientLimit} client limit reached
              </span>
            )}
            <Button onClick={handleAddClient} variant={atLimit ? 'outline' : 'default'}>
              {atLimit ? <><Zap className="w-4 h-4 mr-2 text-amber-500" /> Upgrade to Add More</> : <><Plus className="w-4 h-4 mr-2" /> Add Client</>}
            </Button>
          </div>
        }
      />

      <Card>
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Plan Type</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No clients found</TableCell></TableRow>
            ) : filtered.map(client => (
              <TableRow key={client.id} className="hover:bg-muted/50">
                <TableCell>
                  <Link to={`/clients/${client.id}`} className="flex items-center gap-2 hover:text-primary">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium">{client.company_name}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{client.contact_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{client.contact_email || ''}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm capitalize">{client.plan_type?.replace(/_/g, ' + ') || '—'}</TableCell>
                <TableCell className="text-sm">{client.employee_count || '—'}</TableCell>
                <TableCell><StatusBadge status={client.status} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditing(client); setDialogOpen(true); }}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(client.id)}>
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

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editing}
        onSave={(data) => saveMutation.mutate(data)}
        saving={saveMutation.isPending}
      />
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} currentTier={isTrial ? 'trial' : plan?.plan_tier} />
    </div>
  );
}