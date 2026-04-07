import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const defaultForm = {
  company_name: '', ein: '', contact_name: '', contact_email: '', contact_phone: '',
  address: '', city: '', state: '', zip: '', plan_type: 'medical', status: 'active',
  employee_count: '', notes: ''
};

const planLabels = {
  medical: 'Medical Only',
  dental: 'Dental Only',
  vision: 'Vision Only',
  medical_dental: 'Medical + Dental',
  medical_vision: 'Medical + Vision',
  medical_dental_vision: 'Medical + Dental + Vision',
  dental_vision: 'Dental + Vision',
};

export default function ClientFormDialog({ open, onOpenChange, client, onSave, saving }) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (client) {
      setForm({ ...defaultForm, ...client, employee_count: client.employee_count || '' });
    } else {
      setForm(defaultForm);
    }
  }, [client, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      employee_count: form.employee_count ? Number(form.employee_count) : undefined,
    });
  };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Add Client'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Company Name *</Label>
              <Input value={form.company_name} onChange={e => set('company_name', e.target.value)} required />
            </div>
            <div>
              <Label>EIN</Label>
              <Input value={form.ein} onChange={e => set('ein', e.target.value)} placeholder="XX-XXXXXXX" />
            </div>
            <div>
              <Label>Employee Count</Label>
              <Input type="number" value={form.employee_count} onChange={e => set('employee_count', e.target.value)} />
            </div>
            <div>
              <Label>Contact Name</Label>
              <Input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
            </div>
            <div>
              <Label>Plan Type</Label>
              <Select value={form.plan_type} onValueChange={v => set('plan_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(planLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <Label>State</Label>
              <Input value={form.state} onChange={e => set('state', e.target.value)} />
            </div>
            <div>
              <Label>Zip</Label>
              <Input value={form.zip} onChange={e => set('zip', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
            </div>
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