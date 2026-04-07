import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, FileText, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import BeneficiaryFormDialog from '@/components/beneficiaries/BeneficiaryFormDialog';
import NoticeGenerationStatus from '@/components/beneficiaries/NoticeGenerationStatus';
import { generateRequiredNotices, COVERAGE_MONTHS } from '@/lib/cobraUtils';
import { sendNoticeEmails } from '@/lib/noticeEmailService';

export default function Beneficiaries() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [generationStatus, setGenerationStatus] = useState(null); // { status, notices, errors }
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: beneficiaries = [], isLoading } = useQuery({
    queryKey: ['beneficiaries'],
    queryFn: () => base44.entities.Beneficiary.list()
  });
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });
  const { data: existingNotices = [] } = useQuery({
    queryKey: ['notices'],
    queryFn: () => base44.entities.CobraNotice.list()
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const {
        event_type, event_date, coverage_loss_date, notification_date,
        ...beneficiaryData
      } = data;

      // Save / update the beneficiary
      const saved = editing
        ? await base44.entities.Beneficiary.update(editing.id, beneficiaryData)
        : await base44.entities.Beneficiary.create(beneficiaryData);

      // If a qualifying event was entered inline, create it and auto-generate notices
      if (event_type && event_date) {
        const clientRecord = clients.find(c => c.id === saved.client_id);
        const beneficiaryWithId = { ...saved };

        // Create the QualifyingEvent record
        const qualifyingEvent = await base44.entities.QualifyingEvent.create({
          beneficiary_id: saved.id,
          beneficiary_name: `${saved.first_name} ${saved.last_name}`,
          client_id: saved.client_id,
          client_name: clientRecord?.company_name || saved.client_name,
          event_type,
          event_date,
          coverage_loss_date: coverage_loss_date || event_date,
          notification_date: notification_date || event_date,
          max_coverage_months: COVERAGE_MONTHS[event_type] || 18,
          status: 'notice_sent',
        });

        const requiredNotices = generateRequiredNotices(beneficiaryWithId, qualifyingEvent, clientRecord);

        // Avoid duplicates
        const alreadyCreated = existingNotices
          .filter(n => n.beneficiary_id === saved.id && n.qualifying_event_id === qualifyingEvent.id)
          .map(n => n.notice_type);

        const newNotices = requiredNotices.filter(n => !alreadyCreated.includes(n.notice_type));

        const createdNotices = [];
        for (const notice of newNotices) {
          const created = await base44.entities.CobraNotice.create(notice);
          createdNotices.push(created);
        }

        // Send emails for each new notice
        const emailResults = [];
        for (const notice of createdNotices) {
          try {
            const result = await sendNoticeEmails({ notice });
            emailResults.push({ notice, ...result });
          } catch (err) {
            emailResults.push({ notice, adminSent: false, clientSent: false, error: err.message });
          }
        }

        setGenerationStatus({ notices: createdNotices, emailResults });
      }

      return saved;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      queryClient.invalidateQueries({ queryKey: ['qualifying_events'] });
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (err) => {
      toast({ title: 'Error saving beneficiary', description: err.message, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Beneficiary.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['beneficiaries'] }),
  });

  const filtered = beneficiaries.filter(b =>
    `${b.first_name} ${b.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    b.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Qualified Beneficiaries"
        description="Track all COBRA-eligible individuals"
        actions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Beneficiary
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search beneficiaries..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Relationship</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead>COBRA Dates</TableHead>
              <TableHead>Premium</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No beneficiaries found</TableCell></TableRow>
            ) : filtered.map(b => (
              <TableRow key={b.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{b.first_name} {b.last_name}</TableCell>
                <TableCell className="text-sm">{b.client_name || '—'}</TableCell>
                <TableCell className="text-sm capitalize">{b.relationship || '—'}</TableCell>
                <TableCell className="text-sm capitalize">{b.coverage_type?.replace(/_/g, ' + ') || '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {b.cobra_start_date && <div>Start: {b.cobra_start_date}</div>}
                  {b.cobra_end_date && <div>End: {b.cobra_end_date}</div>}
                  {!b.cobra_start_date && !b.cobra_end_date && '—'}
                </TableCell>
                <TableCell className="text-sm">{b.monthly_premium ? `$${b.monthly_premium.toFixed(2)}` : '—'}</TableCell>
                <TableCell><StatusBadge status={b.cobra_status} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditing(b); setDialogOpen(true); }}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(b.id)}>
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

      <BeneficiaryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        beneficiary={editing}
        clients={clients}
        onSave={(data) => saveMutation.mutate(data)}
        saving={saveMutation.isPending}
      />

      {generationStatus && (
        <NoticeGenerationStatus
          status={generationStatus}
          onClose={() => setGenerationStatus(null)}
        />
      )}
    </div>
  );
}