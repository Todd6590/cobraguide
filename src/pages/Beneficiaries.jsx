import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Zap } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useSubscription } from '@/lib/SubscriptionContext';
import { useTeam } from '@/lib/TeamContext';
import UpgradeDialog from '@/components/subscription/UpgradeDialog';
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
import CobraStatusChangeDialog from '@/components/participants/CobraStatusChangeDialog';
import { generateRequiredNotices, COVERAGE_MONTHS } from '@/lib/cobraUtils';
import { sendNoticeEmails } from '@/lib/noticeEmailService';

export default function Beneficiaries() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [generationStatus, setGenerationStatus] = useState(null);
  const [statusChangeDialog, setStatusChangeDialog] = useState(null); // { participant, previousStatus, newStatus, pendingData }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // participant to delete
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { beneficiaryLimit, isTrial, trialExpired, user } = useSubscription();
  const { ownerEmail } = useTeam();

  const { data: beneficiaries = [], isLoading } = useQuery({
    queryKey: ['beneficiaries', ownerEmail],
    queryFn: () => ownerEmail ? base44.entities.Beneficiary.filter({ owner_email: ownerEmail }) : [],
    enabled: !!ownerEmail,
  });
  const { data: clients = [] } = useQuery({
    queryKey: ['clients', ownerEmail],
    queryFn: () => ownerEmail ? base44.entities.Client.filter({ owner_email: ownerEmail }) : [],
    enabled: !!ownerEmail,
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

      const saved = editing
        ? await base44.entities.Beneficiary.update(editing.id, beneficiaryData)
        : await base44.entities.Beneficiary.create({ ...beneficiaryData, owner_email: ownerEmail });

      if (event_type && event_date) {
        const clientRecord = clients.find(c => c.id === saved.client_id);
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

        const requiredNotices = generateRequiredNotices(saved, qualifyingEvent, clientRecord);
        const alreadyCreated = existingNotices
          .filter(n => n.beneficiary_id === saved.id && n.qualifying_event_id === qualifyingEvent.id)
          .map(n => n.notice_type);
        const newNotices = requiredNotices.filter(n => !alreadyCreated.includes(n.notice_type));

        const createdNotices = [];
        for (const notice of newNotices) {
          const created = await base44.entities.CobraNotice.create(notice);
          createdNotices.push(created);
        }

        const emailResults = [];
        for (const notice of createdNotices) {
          if (notice.notice_type === 'election') {
            try {
              const result = await sendNoticeEmails({ notice });
              emailResults.push({ notice, ...result });
            } catch (err) {
              emailResults.push({ notice, adminSent: false, clientSent: false, error: err.message });
            }
          } else {
            emailResults.push({ notice, adminSent: false, clientSent: false, deferred: true });
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
      toast({ title: 'Error saving participant', description: err.message, variant: 'destructive' });
    }
  });

  // Called when BeneficiaryFormDialog saves — intercept if cobra_status changed
  const handleSave = (data) => {
    const previousStatus = editing?.cobra_status;
    const newStatus = data.cobra_status;
    if (editing && previousStatus !== newStatus) {
      // Show status change dialog before saving
      setStatusChangeDialog({ participant: editing, previousStatus, newStatus, pendingData: data });
    } else {
      saveMutation.mutate(data);
    }
  };

  const statusChangeMutation = useMutation({
    mutationFn: async ({ pendingData, logData }) => {
      const saved = await base44.entities.Beneficiary.update(pendingData.id || editing.id, pendingData);
      // Log the activity
      await base44.entities.ParticipantActivityLog.create({
        beneficiary_id: saved.id,
        participant_name: `${saved.first_name} ${saved.last_name}`,
        client_id: saved.client_id,
        client_name: saved.client_name,
        activity_type: 'status_change',
        previous_status: logData.previousStatus,
        new_status: logData.newStatus,
        activity_date: logData.activityDate,
        activity_time: logData.activityTime,
        delivery_method: logData.deliveryMethod || undefined,
        notes: logData.notes || undefined,
        document_url: logData.documentUrl || undefined,
        document_name: logData.documentName || undefined,
        logged_by: user?.email,
      });
      return saved;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
      setStatusChangeDialog(null);
      setDialogOpen(false);
      setEditing(null);
      toast({ title: 'Participant status updated and activity logged.' });
    },
    onError: (err) => {
      toast({ title: 'Error updating status', description: err.message, variant: 'destructive' });
    }
  });

  const handleStatusChangeConfirm = (logData) => {
    if (!statusChangeDialog) return;
    statusChangeMutation.mutate({
      pendingData: statusChangeDialog.pendingData,
      logData: {
        ...logData,
        previousStatus: statusChangeDialog.previousStatus,
        newStatus: statusChangeDialog.newStatus,
      },
    });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // Delete all related records first
      const [relatedEvents, relatedNotices, relatedPayments, relatedLogs] = await Promise.all([
        base44.entities.QualifyingEvent.filter({ beneficiary_id: id }),
        base44.entities.CobraNotice.filter({ beneficiary_id: id }),
        base44.entities.Payment.filter({ beneficiary_id: id }),
        base44.entities.ParticipantActivityLog.filter({ beneficiary_id: id }),
      ]);
      await Promise.all([
        ...relatedEvents.map(e => base44.entities.QualifyingEvent.delete(e.id)),
        ...relatedNotices.map(n => base44.entities.CobraNotice.delete(n.id)),
        ...relatedPayments.map(p => base44.entities.Payment.delete(p.id)),
        ...relatedLogs.map(l => base44.entities.ParticipantActivityLog.delete(l.id)),
      ]);
      await base44.entities.Beneficiary.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      queryClient.invalidateQueries({ queryKey: ['qualifying_events'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
      toast({ title: 'Participant and all related records deleted.' });
    },
    onError: (err) => {
      toast({ title: 'Error deleting participant', description: err.message, variant: 'destructive' });
    }
  });

  const filtered = beneficiaries.filter(b =>
    `${b.first_name} ${b.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    b.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  const ownedCount = beneficiaries.length;
  const atLimit = beneficiaryLimit > 0 && ownedCount >= beneficiaryLimit;

  const handleAddParticipant = () => {
    if (trialExpired || atLimit) { setUpgradeOpen(true); return; }
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Participants"
        description="Track all COBRA-eligible participants"
        actions={
          <div className="flex items-center gap-2">
            {atLimit && !trialExpired && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                {beneficiaryLimit} participant limit reached
              </span>
            )}
            <Button onClick={handleAddParticipant} variant={(atLimit || trialExpired) ? 'outline' : 'default'}>
              {(atLimit || trialExpired)
                ? <><Zap className="w-4 h-4 mr-2 text-amber-500" /> Upgrade to Add More</>
                : <><Plus className="w-4 h-4 mr-2" /> Add Participant</>}
            </Button>
          </div>
        }
      />

      <Card>
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search participants..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No participants found</TableCell></TableRow>
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
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirm(b)}>
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

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} currentTier={isTrial ? 'trial' : undefined} reason="participant" />
      <BeneficiaryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        beneficiary={editing}
        clients={clients}
        onSave={handleSave}
        saving={saveMutation.isPending}
      />

      {statusChangeDialog && (
        <CobraStatusChangeDialog
          open={!!statusChangeDialog}
          onOpenChange={(open) => { if (!open) setStatusChangeDialog(null); }}
          participant={statusChangeDialog.participant}
          previousStatus={statusChangeDialog.previousStatus}
          newStatus={statusChangeDialog.newStatus}
          onConfirm={handleStatusChangeConfirm}
          saving={statusChangeMutation.isPending}
        />
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you wish to delete this participant?</AlertDialogTitle>
            <AlertDialogDescription>
              Once a participant is deleted, there is no way to restore the information. This will also permanently delete all associated qualifying events, notices, payments, and activity logs for <strong>{deleteConfirm?.first_name} {deleteConfirm?.last_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { deleteMutation.mutate(deleteConfirm.id); setDeleteConfirm(null); }}
            >
              Yes, Delete Participant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {generationStatus && (
        <NoticeGenerationStatus
          status={generationStatus}
          onClose={() => setGenerationStatus(null)}
        />
      )}
    </div>
  );
}