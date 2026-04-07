import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const noticeTypeLabels = {
  general_rights: 'General Rights Notice',
  election: 'Election Notice',
  unavailability: 'Unavailability Notice',
  early_termination: 'Early Termination Notice',
  insufficient_payment: 'Insufficient Payment Notice',
  conversion: 'Conversion Notice',
};

const defaultForm = {
  beneficiary_id: '', beneficiary_name: '', client_id: '', client_name: '',
  qualifying_event_id: '', notice_type: 'election', due_date: '', sent_date: '',
  delivery_method: 'first_class_mail', status: 'pending', election_deadline: '', notes: ''
};

export default function NoticeFormDialog({ open, onOpenChange, notice, beneficiaries, onSave, saving }) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (notice) {
      setForm({ ...defaultForm, ...notice });
    } else {
      setForm(defaultForm);
    }
  }, [notice, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedBeneficiary = beneficiaries.find(b => b.id === form.beneficiary_id);
    onSave({
      ...form,
      beneficiary_name: selectedBeneficiary ? `${selectedBeneficiary.first_name} ${selectedBeneficiary.last_name}` : form.beneficiary_name,
      client_id: selectedBeneficiary?.client_id || form.client_id,
      client_name: selectedBeneficiary?.client_name || form.client_name,
    });
  };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{notice ? 'Edit Notice' : 'Create Notice'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Beneficiary *</Label>
            <Select value={form.beneficiary_id} onValueChange={v => set('beneficiary_id', v)}>
              <SelectTrigger><SelectValue placeholder="Select beneficiary" /></SelectTrigger>
              <SelectContent>
                {beneficiaries.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.first_name} {b.last_name} — {b.client_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notice Type *</Label>
            <Select value={form.notice_type} onValueChange={v => set('notice_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(noticeTypeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
            <div>
              <Label>Sent Date</Label>
              <Input type="date" value={form.sent_date} onChange={e => set('sent_date', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Delivery Method</Label>
              <Select value={form.delivery_method} onValueChange={v => set('delivery_method', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_class_mail">First Class Mail</SelectItem>
                  <SelectItem value="certified_mail">Certified Mail</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="hand_delivered">Hand Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Election Deadline</Label>
            <Input type="date" value={form.election_deadline} onChange={e => set('election_deadline', e.target.value)} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}