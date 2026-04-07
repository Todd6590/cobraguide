import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays } from 'lucide-react';
import {
  calcCobraEndDate,
  calcCoverageLossDate,
  calcCobraStartDate,
  calcNotificationDate,
  COVERAGE_MONTHS,
  EVENT_TYPE_LABELS,
} from '@/lib/cobraUtils';
import { format } from 'date-fns';

const defaultForm = {
  first_name: '', last_name: '', email: '', phone: '', ssn_last4: '',
  date_of_birth: '', address: '', city: '', state: '', zip: '',
  client_id: '', client_name: '', relationship: 'employee',
  coverage_type: 'medical', cobra_status: 'pending_event',
  cobra_start_date: '', cobra_end_date: '', monthly_premium: '', notes: '',
  // qualifying event fields (inline)
  event_type: '', event_date: '',
};

export default function BeneficiaryFormDialog({
  open, onOpenChange, beneficiary, clients, onSave, saving
}) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (beneficiary) {
      setForm({ ...defaultForm, ...beneficiary, monthly_premium: beneficiary.monthly_premium || '' });
    } else {
      setForm(defaultForm);
    }
  }, [beneficiary, open]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  // Recalculate all date fields when event_date or event_type changes
  const handleEventDateChange = (eventDate) => {
    setForm(f => {
      const coverageLoss = calcCoverageLossDate(eventDate);
      const notification = calcNotificationDate(eventDate);
      const cobraStart = calcCobraStartDate(eventDate);
      const cobraEnd = f.event_type ? calcCobraEndDate(cobraStart, f.event_type) : '';
      return {
        ...f,
        event_date: eventDate,
        coverage_loss_date: coverageLoss,
        notification_date: notification,
        cobra_start_date: cobraStart,
        cobra_end_date: cobraEnd,
      };
    });
  };

  const handleEventTypeChange = (eventType) => {
    setForm(f => {
      const cobraEnd = f.cobra_start_date ? calcCobraEndDate(f.cobra_start_date, eventType) : '';
      return { ...f, event_type: eventType, cobra_end_date: cobraEnd };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedClient = clients.find(c => c.id === form.client_id);
    onSave({
      ...form,
      client_name: selectedClient?.company_name || form.client_name,
      monthly_premium: form.monthly_premium ? Number(form.monthly_premium) : undefined,
    });
  };

  const coverageMonths = form.event_type ? COVERAGE_MONTHS[form.event_type] : null;

  const ReadOnlyField = ({ label, value, highlight }) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className={`flex h-9 w-full rounded-md border px-3 py-2 text-sm items-center ${
        highlight ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-muted/50 border-input text-muted-foreground'
      }`}>
        {value || <span className="text-muted-foreground/50 italic">Auto-calculated</span>}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{beneficiary ? 'Edit Beneficiary' : 'Add Beneficiary'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
            </div>
            <div>
              <Label>Client *</Label>
              <Select value={form.client_id} onValueChange={v => set('client_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Relationship</Label>
              <Select value={form.relationship} onValueChange={v => set('relationship', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="dependent">Dependent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
            </div>
            <div>
              <Label>SSN Last 4</Label>
              <Input value={form.ssn_last4} onChange={e => set('ssn_last4', e.target.value)} maxLength={4} placeholder="XXXX" />
            </div>
            <div>
              <Label>Coverage Type</Label>
              <Select value={form.coverage_type} onValueChange={v => set('coverage_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="dental">Dental</SelectItem>
                  <SelectItem value="vision">Vision</SelectItem>
                  <SelectItem value="medical_dental">Medical + Dental</SelectItem>
                  <SelectItem value="medical_vision">Medical + Vision</SelectItem>
                  <SelectItem value="medical_dental_vision">Medical + Dental + Vision</SelectItem>
                  <SelectItem value="dental_vision">Dental + Vision</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>COBRA Status</Label>
              <Select value={form.cobra_status} onValueChange={v => set('cobra_status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_event">Pending Event</SelectItem>
                  <SelectItem value="notice_sent">Notice Sent</SelectItem>
                  <SelectItem value="elected">Elected</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Monthly Premium</Label>
              <Input type="number" step="0.01" value={form.monthly_premium} onChange={e => set('monthly_premium', e.target.value)} placeholder="$0.00" />
            </div>
          </div>

          {/* Qualifying Event Section */}
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Qualifying Event</span>
              {coverageMonths && (
                <span className="ml-auto text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full">
                  {coverageMonths}-month coverage
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Event Type</Label>
                <Select value={form.event_type} onValueChange={handleEventTypeChange}>
                  <SelectTrigger><SelectValue placeholder="Select event type" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Event Date</Label>
                <Input
                  type="date"
                  value={form.event_date}
                  onChange={e => handleEventDateChange(e.target.value)}
                />
              </div>
            </div>

            {/* Auto-calculated fields — shown once event date is entered */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ReadOnlyField
                label="Coverage Loss Date (last day of event month)"
                value={form.coverage_loss_date}
              />
              <ReadOnlyField
                label="Employer Notification Due (30 days from event)"
                value={form.notification_date}
              />
              <ReadOnlyField
                label="COBRA Eligible Start Date (1st of following month)"
                value={form.cobra_start_date}
                highlight
              />
              <ReadOnlyField
                label={`Coverage End Date${coverageMonths ? ` (${coverageMonths} months)` : ''}`}
                value={form.cobra_end_date}
                highlight
              />
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save & Generate Notices'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}