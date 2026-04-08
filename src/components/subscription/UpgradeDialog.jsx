import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Zap, Clock, Tag } from 'lucide-react';
import { PLANS } from '@/lib/SubscriptionContext';
import { base44 } from '@/api/base44Client';
import { useState } from 'react';
import { useSubscription } from '@/lib/SubscriptionContext';
import { useToast } from '@/components/ui/use-toast';

const PLAN_FEATURES = {
  trial:        ['1 client', '1 beneficiary', '3-day free trial', 'All COBRA tools'],
  starter:      ['Up to 5 clients', 'Unlimited beneficiaries', 'All COBRA tools', 'Notice management', 'Payment tracking', 'Reports'],
  professional: ['Up to 25 clients', 'All Starter features', 'Priority support'],
  agency:       ['Unlimited clients', 'All Professional features', 'Custom logo & white-labeling', 'Reports with your branding'],
};

export default function UpgradeDialog({ open, onOpenChange, currentTier, reason }) {
  const { plan, refreshPlan, isTrial, trialExpired, trialDaysRemaining, user } = useSubscription();
  const [upgrading, setUpgrading] = useState(null);
  const [discountCode, setDiscountCode] = useState('');
  const { toast } = useToast();

  const tierOrder = ['starter', 'professional', 'agency'];
  const currentIndex = tierOrder.indexOf(currentTier || 'starter');

  const handleUpgrade = async (tier) => {
    // Block checkout if running inside iframe (preview mode)
    if (window.self !== window.top) {
      toast({
        title: 'Checkout not available in preview',
        description: 'Please open your published app to complete payment.',
        variant: 'destructive',
      });
      return;
    }

    setUpgrading(tier);
    try {
      const origin = window.location.origin;
      const response = await base44.functions.invoke('createCheckoutSession', {
        tier,
        successUrl: `${origin}/settings?upgraded=true`,
        cancelUrl: `${origin}/settings`,
        discountCode: discountCode.trim() || undefined,
        userEmail: user?.email,
      });
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      const detail = err.response?.data?.error || err.response?.data?.message || err.message || 'Unknown error';
      const code = err.response?.data?.code || '';
      const type = err.response?.data?.type || '';
      const status = err.response?.status || '';
      console.error('Checkout error:', { detail, code, type, status, full: err.response?.data });
      alert(`DEBUG - Status: ${status} | Error: ${detail} | Code: ${code} | Type: ${type}`);
      toast({ title: 'Error starting checkout', description: detail, variant: 'destructive' });
    } finally {
      setUpgrading(null);
    }
  };

  const description = trialExpired
    ? 'Your 3-day free trial has ended. Choose a plan to continue.'
    : reason === 'beneficiary'
    ? 'You\'ve reached your trial limit of 1 beneficiary. Upgrade to add more.'
    : 'You\'ve reached your trial limit of 1 client. Upgrade to add more.';

  return (
    <Dialog open={open} onOpenChange={trialExpired ? undefined : onOpenChange}>
      <DialogContent className={`max-w-3xl ${trialExpired ? '[&>button]:hidden' : ''}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {trialExpired
              ? <><Clock className="w-5 h-5 text-red-500" /> Your Trial Has Ended</>
              : <><Zap className="w-5 h-5 text-amber-500" /> Upgrade Your Plan</>
            }
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {isTrial && !trialExpired && trialDaysRemaining !== null && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-700">
            <Clock className="w-4 h-4 flex-shrink-0" />
            {trialDaysRemaining === 0
              ? 'Your trial expires today!'
              : `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} remaining in your free trial.`}
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          <Tag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input
            placeholder="Have a discount code? Enter it here"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            className="text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          {tierOrder.map((tier, idx) => {
            const info = PLANS[tier];
            const isCurrent = !isTrial && tier === currentTier;
            const isUpgrade = isTrial || idx > currentIndex;
            return (
              <div
                key={tier}
                className={`rounded-xl border-2 p-5 flex flex-col gap-3 ${
                  isCurrent ? 'border-primary bg-primary/5' : isUpgrade ? `${info.border} ${info.bg}` : 'border-border opacity-60'
                }`}
              >
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest ${info.color}`}>{info.label}</p>
                  <p className="text-2xl font-bold mt-1">{info.price}</p>
                  <p className="text-xs text-muted-foreground">{info.clientLimit === 0 ? 'Unlimited clients' : `Up to ${info.clientLimit} clients`}</p>
                </div>
                <ul className="space-y-1.5 flex-1">
                  {PLAN_FEATURES[tier].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button disabled variant="outline" size="sm">Current Plan</Button>
                ) : isUpgrade ? (
                  <Button
                    size="sm"
                    className={`${info.bg} ${info.color} border ${info.border} hover:opacity-90`}
                    variant="outline"
                    onClick={() => handleUpgrade(tier)}
                    disabled={!!upgrading}
                  >
                    {upgrading === tier ? 'Upgrading...' : `Upgrade to ${info.label}`}
                  </Button>
                ) : (
                  <Button disabled variant="ghost" size="sm">Lower Tier</Button>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}