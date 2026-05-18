import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STATUS_LABELS = {
  pending_event: 'Pending Event',
  notice_sent: 'Notice Sent',
  elected: 'Elected',
  declined: 'Declined',
  active: 'Active',
  terminated: 'Terminated',
  expired: 'Expired',
};

const STATUS_PROMPTS = {
  notice_sent: 'Please provide details about how and when the notice was sent.',
  elected: 'Please provide details about when and how COBRA coverage was elected.',
  declined: 'Please provide details about when and how COBRA was declined.',
  active: 'Please provide details about when COBRA coverage became active.',
  terminated: 'Please provide details about when and why COBRA coverage was terminated.',
  expired: 'Please provide details about when COBRA coverage expired.',
  pending_event: 'Please provide any relevant details about this status change.',
};

const SHOW_DELIVERY_METHOD = ['notice_sent', 'elected', 'declined'];

export default function CobraStatusChangeDialog({
  open, onOpenChange, participant, previousStatus, newStatus, onConfirm, saving
}) {
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
  const [activityTime, setActivityTime] = useState(new Date().toTimeString().slice(0, 5));
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedFile({ url: file_url, name: file.name });
    setUploading(false);
  };

  const handleConfirm = () => {
    onConfirm({
      activityDate,
      activityTime,
      deliveryMethod,
      notes,
      documentUrl: uploadedFile?.url || null,
      documentName: uploadedFile?.name || null,
    });
  };

  const handleClose = () => {
    setActivityDate(new Date().toISOString().split('T')[0]);
    setActivityTime(new Date().toTimeString().slice(0, 5));
    setDeliveryMethod('');
    setNotes('');
    setUploadedFile(null);
    onOpenChange(false);
  };

  if (!newStatus) return null;

  const showDelivery = SHOW_DELIVERY_METHOD.includes(newStatus);
  const promptText = STATUS_PROMPTS[newStatus] || STATUS_PROMPTS.pending_event;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Status Change — {participant?.first_name} {participant?.last_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status change summary */}
          <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3 text-sm">
            <span className="text-muted-foreground">{STATUS_LABELS[previousStatus] || previousStatus}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-semibold text-foreground">{STATUS_LABELS[newStatus] || newStatus}</span>
          </div>

          <p className="text-sm text-muted-foreground">{promptText}</p>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={activityDate}
                onChange={e => setActivityDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={activityTime}
                onChange={e => setActivityTime(e.target.value)}
              />
            </div>
          </div>

          {/* Delivery Method — shown for relevant statuses */}
          {showDelivery && (
            <div>
              <Label>Method / Delivery</Label>
              <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_class_mail">First Class Mail</SelectItem>
                  <SelectItem value="certified_mail">Certified Mail</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="hand_delivered">Hand Delivered</SelectItem>
                  <SelectItem value="fax">Fax</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label>Notes / Details</Label>
            <Textarea
              placeholder="Add any relevant details..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Document Upload */}
          <div>
            <Label>Supporting Document (Optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">Upload a mail receipt, signed form, or other documentation.</p>
            {uploadedFile ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-sm text-emerald-700 flex-1 truncate">{uploadedFile.name}</span>
                <button
                  type="button"
                  onClick={() => setUploadedFile(null)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-input rounded-lg px-3 py-2 hover:bg-muted/40 transition-colors">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload file'}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </label>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={saving || uploading}>
            {saving ? 'Saving...' : 'Confirm Status Change'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}