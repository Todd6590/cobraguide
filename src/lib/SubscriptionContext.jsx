import { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useTeam } from '@/lib/TeamContext';

const SubscriptionContext = createContext(null);

const TRIAL_DAYS = 3;

export const PLAN = {
  label: 'COBRA Shield Pro',
  price: '$19/mo',
  color: 'text-blue-600',
  bg: 'bg-blue-50',
  border: 'border-blue-200',
};

export function SubscriptionProvider({ children }) {
  const [plan, setPlan] = useState(null);
  const [tenantSettings, setTenantSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { ownerEmail, loading: teamLoading } = useTeam();

  const load = async (resolvedOwnerEmail) => {
    try {
      const me = await base44.auth.me();
      setUser(me);

      const emailToUse = resolvedOwnerEmail || me.email;

      const plans = await base44.entities.SubscriptionPlan.filter({ user_email: emailToUse });
      if (plans.length > 0) {
        setPlan(plans[0]);
      } else if (emailToUse === me.email) {
        const created = await base44.entities.SubscriptionPlan.create({
          user_email: me.email,
          plan_tier: 'trial',
          client_limit: 0,
          trial_start_date: new Date().toISOString().split('T')[0],
        });
        setPlan(created);
      }

      const settings = await base44.entities.TenantSettings.filter({ user_email: emailToUse });
      if (settings.length > 0) setTenantSettings(settings[0]);

    } catch (e) {
      // not authenticated or error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!teamLoading) {
      load(ownerEmail);
    }
  }, [teamLoading, ownerEmail]);

  const isTrial = plan?.plan_tier === 'trial';

  const trialExpired = (() => {
    if (!isTrial || !plan?.trial_start_date) return false;
    const start = new Date(plan.trial_start_date);
    const diffDays = (new Date() - start) / (1000 * 60 * 60 * 24);
    return diffDays >= TRIAL_DAYS;
  })();

  const trialDaysRemaining = (() => {
    if (!isTrial || !plan?.trial_start_date) return null;
    const start = new Date(plan.trial_start_date);
    const diffDays = (new Date() - start) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(TRIAL_DAYS - diffDays));
  })();

  const clientLimit = 0;      // always unlimited
  const beneficiaryLimit = 0; // always unlimited

  const refreshPlan = () => load();

  return (
    <SubscriptionContext.Provider value={{
      plan, tenantSettings, loading, user,
      clientLimit, beneficiaryLimit,
      isAgency: true,
      isTrial, trialExpired, trialDaysRemaining,
      isStudyGroupTrial: false,
      studyGroupExpired: false,
      studyGroupDaysRemaining: null,
      currentPlanInfo: PLAN,
      refreshPlan, setTenantSettings
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}