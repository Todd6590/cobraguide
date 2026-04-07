import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const defaultForm = {
  beneficiary_id: '', beneficiary_name: '', client_id: '', client_name: '',
  amount: '', period_start: '', period_end: '', due_date: '', received_date: '',
  status: 'pending', payment_method: 'check', reference_number: '', notes: ''
};

export default function PaymentFormDialog({ open, onOpenChange, payment, beneficiaries, onSave, saving }) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (payment) {
      setForm({ ...defaultForm, ...payment, amount: payment.amount || '' });
    } else {
      setForm(defaultForm);
    }
  }, [payment, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedBeneficiary = beneficiaries.find(b => b.id === form.beneficiary_id);
    onSave({
      ...form,
      beneficiary_name: selectedBeneficiary ? `${selectedBeneficiary.first_name} ${selectedBeneficiary.last_name}` : form.beneficiary_name,
      client_id: selectedBeneficiary?.client_id || form.client_id,
      client_name: selectedBeneficiary?.client_name || form.client_name,
      amount: form.amount ? Number(form.amount) : 0,
    });
  };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{payment ? 'Edit Payment' : 'Record Payment'}</DialogTitle>
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
            <Label>Amount *</Label>
            <Input type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="$0.00" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Period Start</Label>
              <Input type="date" value={form.period_start} onChange={e => set('period_start', e.target.value)} />
            </div>
            <div>
              <Label>Period End</Label>
              <Input type="date" value={form.period_end} onChange={e => set('period_end', e.target.value)} />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
            <div>
              <Label>Received Date</Label>
              <Input type="date" value={form.received_date} onChange={e => set('received_date', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                  <SelectItem value="grace_period">Grace Period</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={form.payment_method} onValueChange={v => set('payment_method', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="ach">ACH</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="wire">Wire Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Reference Number</Label>
            <Input value={form.reference_number} onChange={e => set('reference_number', e.target.value)} placeholder="Check # or transaction ID" />
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