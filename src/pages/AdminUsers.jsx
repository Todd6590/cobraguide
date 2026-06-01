import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useSubscription } from '@/lib/SubscriptionContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight, Users, Crown, Search, Shield, Building2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

const planColors = {
  trial:        'bg-gray-100 text-gray-600',
  starter:      'bg-blue-50 text-blue-700',
  professional: 'bg-violet-50 text-violet-700',
  agency:       'bg-emerald-50 text-emerald-700',
};

function SubscriberRow({ subscriber, teamMembers, clients }) {
  const [expanded, setExpanded] = useState(false);
  const members = teamMembers.filter(m => m.owner_email === subscriber.user_email);
  const clientCount = clients.filter(c => c.owner_email === subscriber.user_email).length;

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Subscriber header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-muted/30 cursor-pointer transition-colors"
        onClick={() => members.length > 0 && setExpanded(!expanded)}
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Crown className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{subscriber.full_name || '—'}</p>
          <p className="text-xs text-muted-foreground truncate">{subscriber.user_email}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="w-3 h-3" /> {clientCount}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColors[subscriber.plan_tier] || planColors.trial}`}>
            {subscriber.plan_tier || 'trial'}
          </span>
          {subscriber.stripe_subscription_id && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">Paid</span>
          )}
          <span className="text-xs text-muted-foreground">
            {subscriber.trial_start_date ? new Date(subscriber.trial_start_date).toLocaleDateString() : '—'}
          </span>
          {members.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground ml-1">
              <Users className="w-3 h-3" /> {members.length}
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </span>
          )}
        </div>
      </div>

      {/* Team members nested */}
      {expanded && members.length > 0 && (
        <div className="border-t bg-muted/20 divide-y">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 pl-12">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-3 h-3 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{m.member_email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  m.role === 'admin' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {m.role}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  m.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {m.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminUsers() {
  const { user } = useSubscription();
  const [search, setSearch] = useState('');
  const isAdmin = user?.role === 'admin';

  const { data: allPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['admin-all-plans'],
    queryFn: () => base44.entities.SubscriptionPlan.list('-created_date', 500),
    enabled: isAdmin,
  });

  const { data: allTeamMembers = [] } = useQuery({
    queryKey: ['admin-all-team-members'],
    queryFn: () => base44.entities.TeamMember.list('-created_date', 1000),
    enabled: isAdmin,
  });

  const { data: allClients = [] } = useQuery({
    queryKey: ['admin-all-clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 2000),
    enabled: isAdmin,
  });

  // Gate: admin only
  if (user && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 text-center px-6">
        <Shield className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-1">Access Restricted</h2>
        <p className="text-muted-foreground text-sm">This page is only accessible to administrators.</p>
      </div>
    );
  }

  // Team member emails — used to exclude them from top-level subscriber list
  const teamMemberEmails = new Set(allTeamMembers.map(m => m.member_email));

  // Subscribers = plans where the email is NOT a team member of someone else
  const subscribers = allPlans.filter(p => !teamMemberEmails.has(p.user_email));

  const filtered = subscribers.filter(s =>
    !search ||
    s.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    s.plan_tier?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const paidCount = allPlans.filter(p => p.stripe_subscription_id && p.plan_tier !== 'trial').length;
  const trialCount = allPlans.filter(p => p.plan_tier === 'trial').length;
  const totalTeamMembers = allTeamMembers.length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Users"
        description="All subscribers and their team members."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Subscribers', value: subscribers.length, color: 'text-primary' },
          { label: 'Paid', value: paidCount, color: 'text-emerald-600' },
          { label: 'Trial', value: trialCount, color: 'text-amber-600' },
          { label: 'Team Members', value: totalTeamMembers, color: 'text-violet-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.loading ? '…' : s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by email or plan…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wide">
        <div className="w-8 flex-shrink-0" />
        <div className="flex-1">Name / Email</div>
        <div className="hidden sm:block w-16 text-center">Clients</div>
        <div className="w-20 text-center">Plan</div>
        <div className="w-16 text-center">Status</div>
        <div className="w-24 text-right">Joined</div>
        <div className="w-10" />
      </div>

      {/* Subscriber rows */}
      <div className="space-y-2">
        {plansLoading && (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading…</div>
        )}
        {!plansLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No subscribers found.</div>
        )}
        {filtered.map(plan => (
          <SubscriberRow
            key={plan.id}
            subscriber={plan}
            teamMembers={allTeamMembers}
            clients={allClients}
          />
        ))}
      </div>
    </div>
  );
}