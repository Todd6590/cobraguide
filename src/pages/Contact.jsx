import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useSubscription } from '@/lib/SubscriptionContext';
import { CheckCircle, Mail } from 'lucide-react';

const SUBJECTS = [
  'Billing Questions',
  'App Use Questions',
  'Improvement Suggestions',
  'Other',
];

export default function Contact() {
  const { user } = useSubscription();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!subject || !message.trim()) {
      setError('Please select a subject and enter a message.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: 'help@cobrashieldpro.com',
        from_name: user?.full_name || 'COBRA Shield Pro User',
        subject: `[${subject}] - from ${user?.email || 'unknown'}`,
        body: `From: ${user?.full_name || ''} (${user?.email || ''})\n\nSubject: ${subject}\n\n${message}`,
      });
      setSent(true);
    } catch (e) {
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Message Sent!</h2>
        <p className="text-muted-foreground text-sm">Thanks for reaching out. We'll get back to you at <strong>{user?.email}</strong> as soon as possible.</p>
        <Button className="mt-6" variant="outline" onClick={() => { setSent(false); setSubject(''); setMessage(''); }}>
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Contact Support</h1>
        <p className="text-muted-foreground mt-1">We're here to help. Send us a message and we'll respond promptly.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        {/* To field (read-only) */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-3 border border-border">
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span>To: <strong className="text-foreground">help@cobrashieldpro.com</strong></span>
        </div>

        {/* From */}
        {user?.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-3 border border-border">
            <span>From: <strong className="text-foreground">{user.full_name ? `${user.full_name} (${user.email})` : user.email}</strong></span>
          </div>
        )}

        {/* Subject dropdown */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Subject</label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger>
              <SelectValue placeholder="Select a subject..." />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Message</label>
          <Textarea
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[160px] resize-none"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleSend} disabled={sending} className="w-full">
          {sending ? 'Sending...' : 'Send Message'}
        </Button>
      </div>
    </div>
  );
}