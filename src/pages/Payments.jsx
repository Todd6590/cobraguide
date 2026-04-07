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
import PaymentFormDialog from '@/components/payments/PaymentFormDialog';

export default function Payments() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({ queryKey: ['payments'], queryFn: () => base44.entities.Payment.list() });
  const { data: beneficiaries = [] } = useQuery({ queryKey: ['beneficiaries'], queryFn: () => base44.entities.Beneficiary.list() });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Payment.update(editing.id, data)
      : base44.entities.Payment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setDialogOpen(false);
      setEditing(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Payment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  });

  const filtered = payments.filter(p =>
    p.beneficiary_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.reference_number?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);
  const totalReceived = payments.filter(p => p.status === 'received').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Payments"
        description="Track COBRA premium payments"
        actions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Record Payment
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase">Total Payments</p>
          <p className="text-xl font-bold mt-1">{payments.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase">Received</p>
          <p className="text-xl font-bold mt-1 text-emerald-600">${totalReceived.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase">Pending</p>
          <p className="text-xl font-bold mt-1 text-amber-600">${totalPending.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase">Missed</p>
          <p className="text-xl font-bold mt-1 text-red-600">{payments.filter(p => p.status === 'missed').length}</p>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search payments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Beneficiary</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No payments found</TableCell></TableRow>
            ) : filtered.map(payment => (
              <TableRow key={payment.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{payment.beneficiary_name || '—'}</TableCell>
                <TableCell className="text-sm">{payment.client_name || '—'}</TableCell>
                <TableCell className="text-sm font-medium">${payment.amount?.toFixed(2) || '0.00'}</TableCell>
                <TableCell className="text-sm">
                  {payment.period_start && payment.period_end
                    ? `${format(new Date(payment.period_start), 'MMM d')} - ${format(new Date(payment.period_end), 'MMM d')}`
                    : '—'}
                </TableCell>
                <TableCell className="text-sm">{payment.due_date ? format(new Date(payment.due_date), 'MMM d, yyyy') : '—'}</TableCell>
                <TableCell className="text-sm capitalize">{payment.payment_method?.replace(/_/g, ' ') || '—'}</TableCell>
                <TableCell><StatusBadge status={payment.status} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditing(payment); setDialogOpen(true); }}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(payment.id)}>
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

      <PaymentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        payment={editing}
        beneficiaries={beneficiaries}
        onSave={(data) => saveMutation.mutate(data)}
        saving={saveMutation.isPending}
      />
    </div>
  );
}