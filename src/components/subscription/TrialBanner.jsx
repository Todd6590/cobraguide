import { Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/lib/SubscriptionContext';
import { useState } from 'react';
import UpgradeDialog from './UpgradeDialog';

export default function TrialBanner() {
  const { isTrial, trialExpired, trialDaysRemaining } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (!isTrial) return null;

  return (
    <>
      <div className={`flex items-center justify-between gap-3 px-4 py-2 text-sm ${
        trialExpired ? 'bg-red-600 text-white' : trialDaysRemaining <= 1 ? 'bg-amber-500 text-white' : 'bg-primary text-primary-foreground'
      }`}>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 flex-shrink-0" />
          {trialExpired
            ? 'Your 3-day free trial has ended. Upgrade to continue using the app.'
            : trialDaysRemaining === 0
            ? 'Your free trial expires today!'
            : `Free trial: ${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} remaining. Limited to 1 client & 1 beneficiary.`}
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="flex-shrink-0 h-7 text-xs"
          onClick={() => setUpgradeOpen(true)}
        >
          <Zap className="w-3 h-3 mr-1" /> Upgrade Now
        </Button>
      </div>
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} currentTier="trial" />
    </>
  );
}