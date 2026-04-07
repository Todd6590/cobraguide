import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { calcCobraEndDate, COVERAGE_MONTHS, EVENT_TYPE_LABELS } from '@/lib/cobraUtils';
import { format } from 'date-fns';

const defaultForm = {
  first_name: '', last_name: '', email: '', phone: '', ssn_last4: '',
  date_of_birth: '', address: '', city: '', state: '', zip: '',
  client_id: '', client_name: '', relationship: 'employee',
  coverage_type: 'medical', cobra_status: 'pending_event',
  cobra_start_date: '', cobra_end_date: '', monthly_premium: '', notes: ''
};

export default function BeneficiaryFormDialog({
  open, onOpenChange, beneficiary, clients, qualifyingEvents = [], onSave, saving
}) {
  const [form, setForm] = useState(defaultForm);
  const [selectedEventId, setSelectedEventId] = useState('');

  useEffect(() => {
    if (beneficiary) {
      setForm({ ...defaultForm, ...beneficiary, monthly_premium: beneficiary.monthly_premium || '' });
    } else {
      setForm(defaultForm);
    }
    setSelectedEventId('');
  }, [beneficiary, open]);

  // When a qualifying event is selected, auto-fill event-derived fields
  const handleEventSelect = (eventId) => {
    setSelectedEventId(eventId);
    if (!eventId || eventId === 'none') return;
    const event = qualifyingEvents.find(e => e.id === eventId);
    if (!event) return;

    const coverageLossDate = event.coverage_loss_date || event.event_date;
    // COBRA start is typically the day after coverage loss
    const cobraStart = coverageLossDate;
    const cobraEnd = calcCobraEndDate(cobraStart, event.event_type);
    const months = COVERAGE_MONTHS[event.event_type] || 18;

    setForm(f => ({
      ...f,
      cobra_start_date: cobraStart,
      cobra_end_date: cobraEnd,
      cobra_status: f.cobra_status === 'pending_event' ? 'notice_sent' : f.cobra_status,
    }));
  };

  // Recalculate end date if start date changes manually
  const handleStartDateChange = (val) => {
    setForm(f => {
      const selectedEvent = qualifyingEvents.find(e => e.id === selectedEventId);
      const eventType = selectedEvent?.event_type || null;
      const newEnd = eventType ? calcCobraEndDate(val, eventType) : f.cobra_end_date;
      return { ...f, cobra_start_date: val, cobra_end_date: newEnd };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedClient = clients.find(c => c.id === form.client_id);
    const selectedEvent = qualifyingEvents.find(e => e.id === selectedEventId);
    onSave({
      ...form,
      client_name: selectedClient?.company_name || form.client_name,
      monthly_premium: form.monthly_premium ? Number(form.monthly_premium) : undefined,
      _selectedEventId: selectedEventId || null,
      _selectedEvent: selectedEvent || null,
      _selectedClient: selectedClient || null,
    });
  };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  // Filter qualifying events to those for the selected client (if any)
  const relevantEvents = form.client_id
    ? qualifyingEvents.filter(e => e.client_id === form.client_id)
    : qualifyingEvents;

  const selectedEvent = qualifyingEvents.find(e => e.id === selectedEventId);
  const coverageMonths = selectedEvent ? COVERAGE_MONTHS[selectedEvent.event_type] : null;

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
              <Select value={form.client_id} onValueChange={v => { set('client_id', v); setSelectedEventId(''); }}>
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
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Qualifying Event</span>
            </div>
            <div>
              <Label>Link Qualifying Event</Label>
              <Select value={selectedEventId || 'none'} onValueChange={v => handleEventSelect(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select qualifying event (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None selected —</SelectItem>
                  {relevantEvents.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.beneficiary_name} — {EVENT_TYPE_LABELS[e.event_type] || e.event_type} ({e.event_date})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {relevantEvents.length === 0 && form.client_id && (
                <p className="text-xs text-muted-foreground mt-1">No qualifying events found for this client. Add one on the Events page first.</p>
              )}
            </div>

            {selectedEvent && (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                  {EVENT_TYPE_LABELS[selectedEvent.event_type]}
                </Badge>
                <Badge variant="outline" className="text-blue-700">
                  {coverageMonths} months coverage
                </Badge>
                <span className="text-xs text-blue-700">COBRA end date auto-calculated</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>COBRA Start Date</Label>
                <Input
                  type="date"
                  value={form.cobra_start_date}
                  onChange={e => handleStartDateChange(e.target.value)}
                />
              </div>
              <div>
                <Label>COBRA End Date {selectedEvent && <span className="text-blue-600 text-xs ml-1">(auto-calculated)</span>}</Label>
                <Input
                  type="date"
                  value={form.cobra_end_date}
                  onChange={e => set('cobra_end_date', e.target.value)}
                  className={selectedEvent ? 'border-blue-300 bg-blue-50' : ''}
                />
              </div>
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