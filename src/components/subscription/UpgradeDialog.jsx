import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useState } from 'react';
import { useSubscription } from '@/lib/SubscriptionContext';
import { useToast } from '@/components/ui/use-toast';

const FEATURES = [
  'Unlimited clients',
  'Unlimited beneficiaries',
  'All COBRA tools',
  'Notice management',
  'Payment tracking',
  'Reports & white-label branding',
  'Team member access',
];

export default function UpgradeDialog({ open, onOpenChange }) {
  const { user } = useSubscription();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (window.self !== window.top) {
      toast({
        title: 'Checkout not available in preview',
        description: 'Please open your published app to complete payment.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const origin = window.location.origin;
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get('ref') || localStorage.getItem('referral_code') || undefined;

      const response = await base44.functions.invoke('createCheckoutSession', {
        successUrl: `${origin}/settings?upgraded=true`,
        cancelUrl: `${origin}/settings`,
        userEmail: user?.email,
        referralCode,
      });
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      const detail = err.response?.data?.error || err.message;
      toast({ title: 'Error starting checkout', description: detail, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Zap className="w-5 h-5 text-amber-500" /> COBRA Shield Pro
          </DialogTitle>
          <DialogDescription>Subscribe to get full access to all features.</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6 flex flex-col gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">COBRA Shield Pro</p>
            <p className="text-3xl font-bold text-foreground mt-1">$19<span className="text-base font-normal text-muted-foreground">/mo</span></p>
            <p className="text-sm text-muted-foreground mt-0.5">Unlimited clients & beneficiaries</p>
          </div>
          <ul className="space-y-2">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Button onClick={handleSubscribe} disabled={loading} className="w-full" size="lg">
            {loading ? 'Loading...' : 'Subscribe Now — $19/mo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}