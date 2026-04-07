import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const eventTypeLabels = {
  termination: 'Termination',
  reduction_in_hours: 'Reduction in Hours',
  death_of_employee: 'Death of Employee',
  divorce: 'Divorce/Legal Separation',
  medicare_entitlement: 'Medicare Entitlement',
  loss_of_dependent_status: 'Loss of Dependent Status',
  employer_bankruptcy: 'Employer Bankruptcy',
};

const defaultForm = {
  beneficiary_id: '', beneficiary_name: '', client_id: '', client_name: '',
  event_type: 'termination', event_date: '', notification_date: '',
  coverage_loss_date: '', max_coverage_months: 18, status: 'reported', notes: ''
};

export default function EventFormDialog({ open, onOpenChange, event, beneficiaries, clients, onSave, saving }) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (event) {
      setForm({ ...defaultForm, ...event });
    } else {
      setForm(defaultForm);
    }
  }, [event, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedBeneficiary = beneficiaries.find(b => b.id === form.beneficiary_id);
    onSave({
      ...form,
      beneficiary_name: selectedBeneficiary ? `${selectedBeneficiary.first_name} ${selectedBeneficiary.last_name}` : form.beneficiary_name,
      client_id: selectedBeneficiary?.client_id || form.client_id,
      client_name: selectedBeneficiary?.client_name || form.client_name,
      max_coverage_months: Number(form.max_coverage_months),
    });
  };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Qualifying Event' : 'Report Qualifying Event'}</DialogTitle>
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
            <Label>Event Type *</Label>
            <Select value={form.event_type} onValueChange={v => set('event_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(eventTypeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Event Date *</Label>
              <Input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} required />
            </div>
            <div>
              <Label>Notification Date</Label>
              <Input type="date" value={form.notification_date} onChange={e => set('notification_date', e.target.value)} />
            </div>
            <div>
              <Label>Coverage Loss Date</Label>
              <Input type="date" value={form.coverage_loss_date} onChange={e => set('coverage_loss_date', e.target.value)} />
            </div>
            <div>
              <Label>Max Coverage (months)</Label>
              <Select value={String(form.max_coverage_months)} onValueChange={v => set('max_coverage_months', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="18">18 months</SelectItem>
                  <SelectItem value="29">29 months (disability)</SelectItem>
                  <SelectItem value="36">36 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="reported">Reported</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="notice_sent">Notice Sent</SelectItem>
                <SelectItem value="election_pending">Election Pending</SelectItem>
                <SelectItem value="elected">Elected</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
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