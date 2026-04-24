import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { SubscriptionProvider } from '@/lib/SubscriptionContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import ClientDetail from '@/pages/ClientDetail';
import Beneficiaries from '@/pages/Beneficiaries.jsx';
import QualifyingEvents from '@/pages/QualifyingEvents';
import Notices from '@/pages/Notices';
import Payments from '@/pages/Payments';
import NoticeDetail from '@/pages/NoticeDetail';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import GettingStarted from '@/pages/GettingStarted';
import Contact from '@/pages/Contact';
import Referrals from '@/pages/Referrals';
import AffiliateProgram from '@/pages/AffiliateProgram';
import CobraEligibility from '@/pages/CobraEligibility';
import Home from '@/pages/Home';
import SignIn from '@/pages/SignIn';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Not authenticated — show landing page for all routes
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="*" element={<Home />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/beneficiaries" element={<Beneficiaries />} />
        <Route path="/events" element={<QualifyingEvents />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/notices/:id" element={<NoticeDetail />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/getting-started" element={<GettingStarted />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/affiliate-program" element={<AffiliateProgram />} />
        <Route path="/cobra-eligibility" element={<CobraEligibility />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <SubscriptionProvider>
            <AuthenticatedApp />
          </SubscriptionProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App