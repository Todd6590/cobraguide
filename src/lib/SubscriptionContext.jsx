import { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const SubscriptionContext = createContext(null);

export const PLANS = {
  starter:      { label: 'Starter',      clientLimit: 5,   price: '$49/mo',  color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  professional: { label: 'Professional', clientLimit: 25,  price: '$99/mo',  color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  agency:       { label: 'Agency',       clientLimit: 0,   price: '$199/mo', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

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
        // Default to starter for new users
        const created = await base44.entities.SubscriptionPlan.create({
          user_email: me.email,
          plan_tier: 'starter',
          client_limit: 5,
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

  const currentPlanInfo = plan ? PLANS[plan.plan_tier] : PLANS.starter;
  const clientLimit = currentPlanInfo?.clientLimit ?? 5; // 0 = unlimited
  const isAgency = plan?.plan_tier === 'agency';

  const refreshPlan = () => load();

  return (
    <SubscriptionContext.Provider value={{ plan, tenantSettings, loading, user, clientLimit, isAgency, currentPlanInfo, refreshPlan, setTenantSettings }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}