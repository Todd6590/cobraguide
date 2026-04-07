import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Mail, Loader2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { sendNoticeEmails } from '@/lib/noticeEmailService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import NoticeFormDialog from '@/components/notices/NoticeFormDialog';

const noticeTypeLabels = {
  general_rights: 'General Rights',
  election: 'Election Notice',
  unavailability: 'Unavailability',
  early_termination: 'Early Termination',
  insufficient_payment: 'Insufficient Payment',
  conversion: 'Conversion',
};

export default function Notices() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notices = [], isLoading } = useQuery({ queryKey: ['notices'], queryFn: () => base44.entities.CobraNotice.list() });
  const { data: beneficiaries = [] } = useQuery({ queryKey: ['beneficiaries'], queryFn: () => base44.entities.Beneficiary.list() });

  const handleResendEmail = async (notice) => {
    setSendingEmail(notice.id);
    await sendNoticeEmails({ notice });
    setSendingEmail(null);
    toast({ title: 'Notice emails sent', description: 'Notice emailed to admin and client contact.' });
  };

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.CobraNotice.update(editing.id, data)
      : base44.entities.CobraNotice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      setDialogOpen(false);
      setEditing(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CobraNotice.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notices'] }),
  });

  const filtered = notices.filter(n =>
    n.beneficiary_name?.toLowerCase().includes(search.toLowerCase()) ||
    n.notice_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="COBRA Notices"
        description="Track required COBRA notices and deadlines"
        actions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Create Notice
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search notices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Beneficiary</TableHead>
              <TableHead>Notice Type</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Sent Date</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No notices found</TableCell></TableRow>
            ) : filtered.map(notice => (
              <TableRow key={notice.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{notice.beneficiary_name || '—'}</TableCell>
                <TableCell className="text-sm">{noticeTypeLabels[notice.notice_type] || notice.notice_type}</TableCell>
                <TableCell className="text-sm">{notice.due_date ? format(new Date(notice.due_date), 'MMM d, yyyy') : '—'}</TableCell>
                <TableCell className="text-sm">{notice.sent_date ? format(new Date(notice.sent_date), 'MMM d, yyyy') : '—'}</TableCell>
                <TableCell className="text-sm capitalize">{notice.delivery_method?.replace(/_/g, ' ') || '—'}</TableCell>
                <TableCell><StatusBadge status={notice.status} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/notices/${notice.id}`}>
                          <Eye className="w-4 h-4 mr-2" /> View / Print
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditing(notice); setDialogOpen(true); }}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleResendEmail(notice)} disabled={sendingEmail === notice.id}>
                        {sendingEmail === notice.id
                          ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          : <Mail className="w-4 h-4 mr-2" />}
                        Resend Emails
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(notice.id)}>
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

      <NoticeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        notice={editing}
        beneficiaries={beneficiaries}
        onSave={(data) => saveMutation.mutate(data)}
        saving={saveMutation.isPending}
      />
    </div>
  );
}