import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Zap } from 'lucide-react';
import { PLANS } from '@/lib/SubscriptionContext';
import { base44 } from '@/api/base44Client';
import { useState } from 'react';
import { useSubscription } from '@/lib/SubscriptionContext';

const PLAN_FEATURES = {
  starter:      ['Up to 5 clients', 'All COBRA tools', 'Notice management', 'Payment tracking', 'Reports'],
  professional: ['Up to 25 clients', 'All Starter features', 'Priority support'],
  agency:       ['Unlimited clients', 'All Professional features', 'Custom logo & white-labeling', 'Reports with your branding'],
};

export default function UpgradeDialog({ open, onOpenChange, currentTier }) {
  const { plan, refreshPlan } = useSubscription();
  const [upgrading, setUpgrading] = useState(null);

  const tierOrder = ['starter', 'professional', 'agency'];
  const currentIndex = tierOrder.indexOf(currentTier || 'starter');

  const handleUpgrade = async (tier) => {
    setUpgrading(tier);
    try {
      const limit = PLANS[tier].clientLimit;
      await base44.entities.SubscriptionPlan.update(plan.id, {
        plan_tier: tier,
        client_limit: limit,
      });
      refreshPlan();
      onOpenChange(false);
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Zap className="w-5 h-5 text-amber-500" /> Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            You've reached your client limit. Upgrade to add more clients.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          {tierOrder.map((tier, idx) => {
            const info = PLANS[tier];
            const isCurrent = tier === currentTier;
            const isUpgrade = idx > currentIndex;
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