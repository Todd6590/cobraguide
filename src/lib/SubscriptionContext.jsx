import { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const SubscriptionContext = createContext(null);

export const PLANS = {
  trial:        { label: 'Free Trial',    clientLimit: 1,   beneficiaryLimit: 1, price: 'Free',    color: 'text-gray-600',    bg: 'bg-gray-50',    border: 'border-gray-200' },
  starter:      { label: 'Starter',       clientLimit: 5,   beneficiaryLimit: 0, price: '$49/mo',  color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  professional: { label: 'Professional',  clientLimit: 25,  beneficiaryLimit: 0, price: '$99/mo',  color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200' },
  agency:       { label: 'Agency',        clientLimit: 0,   beneficiaryLimit: 0, price: '$199/mo', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

const TRIAL_DAYS = 3;

export function SubscriptionProvider({ children }) {
  const [plan, setPlan] = useState(null);
  const [tenantSettings, setTenantSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const load = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);

      const plans = await base44.entities.SubscriptionPlan.filter({ user_email: me.email });
      if (plans.length > 0) {
        setPlan(plans[0]);
      } else {
        // New user — start on trial
        const created = await base44.entities.SubscriptionPlan.create({
          user_email: me.email,
          plan_tier: 'trial',
          client_limit: 1,
          trial_start_date: new Date().toISOString().split('T')[0],
        });
        setPlan(created);
      }

      const settings = await base44.entities.TenantSettings.filter({ user_email: me.email });
      if (settings.length > 0) setTenantSettings(settings[0]);

    } catch (e) {
      // not authenticated or error — leave as null
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const isTrial = plan?.plan_tier === 'trial';

  // Check if trial has expired
  const trialExpired = (() => {
    if (!isTrial || !plan?.trial_start_date) return false;
    const start = new Date(plan.trial_start_date);
    const now = new Date();
    const diffDays = (now - start) / (1000 * 60 * 60 * 24);
    return diffDays >= TRIAL_DAYS;
  })();

  // Days remaining in trial
  const trialDaysRemaining = (() => {
    if (!isTrial || !plan?.trial_start_date) return null;
    const start = new Date(plan.trial_start_date);
    const now = new Date();
    const diffDays = (now - start) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(TRIAL_DAYS - diffDays));
  })();

  const currentPlanInfo = plan ? PLANS[plan.plan_tier] : PLANS.trial;
  const clientLimit = currentPlanInfo?.clientLimit ?? 1;       // 0 = unlimited
  const beneficiaryLimit = currentPlanInfo?.beneficiaryLimit ?? 1; // 0 = unlimited
  const isAgency = plan?.plan_tier === 'agency';

  const refreshPlan = () => load();

  return (
    <SubscriptionContext.Provider value={{
      plan, tenantSettings, loading, user,
      clientLimit, beneficiaryLimit,
      isAgency, isTrial, trialExpired, trialDaysRemaining,
      currentPlanInfo, refreshPlan, setTenantSettings
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}