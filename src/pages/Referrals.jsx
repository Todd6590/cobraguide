import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useSubscription } from '@/lib/SubscriptionContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Gift, Users, TrendingUp, DollarSign, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/shared/PageHeader';

function getReferralCode(email) {
  return email?.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_') || '';
}

const statusColors = {
  clicked:   'bg-gray-100 text-gray-600',
  signed_up: 'bg-blue-50 text-blue-700',
  converted: 'bg-emerald-50 text-emerald-700',
};

const commissionStatusColors = {
  pending:   'bg-amber-50 text-amber-700',
  approved:  'bg-blue-50 text-blue-700',
  paid:      'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-600',
};

export default function Referrals() {
  const { user } = useSubscription();
  const [copied, setCopied] = useState(false);
  const [adminTab, setAdminTab] = useState('pending');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const referralCode = getReferralCode(user?.email);
  const referralLink = `https://cobrashieldpro.com/?ref=${referralCode}`;

  const { data: myReferrals = [] } = useQuery({
    queryKey: ['referrals', user?.email],
    queryFn: () => base44.entities.Referral.filter({ referrer_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: allReferrals = [] } = useQuery({
    queryKey: ['allReferrals'],
    queryFn: () => base44.entities.Referral.list('-created_date', 500),
    enabled: user?.role === 'admin',
  });

  const updateCommissionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Referral.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allReferrals'] }),
  });

  // My stats
  const converted = myReferrals.filter(r => r.status === 'converted');
  const totalEarned = converted.reduce((sum, r) => sum + (r.total_commission_earned || 0), 0);
  const totalPaid = converted.filter(r => r.commission_status === 'paid').reduce((sum, r) => sum + (r.total_commission_earned || 0), 0);
  const pendingPayout = totalEarned - totalPaid;

  // Admin stats
  const adminConverted = allReferrals.filter(r => r.status === 'converted');
  const adminTotalCommissions = adminConverted.reduce((sum, r) => sum + (r.total_commission_earned || 0), 0);
  const adminPendingPayout = adminConverted.filter(r => r.commission_status !== 'paid').reduce((sum, r) => sum + (r.total_commission_earned || 0), 0);
  const adminPaidOut = adminConverted.filter(r => r.commission_status === 'paid').reduce((sum, r) => sum + (r.total_commission_earned || 0), 0);

  const filteredAdminReferrals = adminTab === 'all'
    ? allReferrals
    : allReferrals.filter(r => r.commission_status === adminTab || (adminTab === 'pending' && !r.commission_status && r.status === 'converted'));

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: 'Referral link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkPaid = (referral) => {
    updateCommissionMutation.mutate({
      id: referral.id,
      data: {
        commission_status: 'paid',
        payout_date: new Date().toISOString().split('T')[0],
      }
    });
    toast({ title: `Marked as paid for ${referral.referrer_email}` });
  };

  const handleMarkApproved = (referral) => {
    updateCommissionMutation.mutate({
      id: referral.id,
      data: { commission_status: 'approved' }
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Affiliate Program"
        description="Earn 20% commission on every subscription payment from users you refer."
      />

      {/* My Affiliate Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Referrals', value: myReferrals.length, icon: Users, color: 'text-blue-600' },
          { label: 'Converted to Paid', value: converted.length, icon: TrendingUp, color: 'text-emerald-600' },
          { label: 'Total Earned', value: `$${totalEarned.toFixed(2)}`, icon: DollarSign, color: 'text-purple-600' },
          { label: 'Pending Payout', value: `$${pendingPayout.toFixed(2)}`, icon: Award, color: 'text-amber-600' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Affiliate Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Share this link. When someone signs up and subscribes, you earn <strong>20% of every monthly payment</strong> — recurring for as long as they stay subscribed.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-md px-3 py-2 text-sm font-mono truncate border">
              {referralLink}
            </div>
            <Button onClick={handleCopy} variant="outline" size="sm" className="gap-1.5 flex-shrink-0">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={`https://twitter.com/intent/tweet?text=I%20use%20COBRA%20Shield%20Pro%20to%20manage%20COBRA%20compliance.%20Try%20it%20free%3A%20${encodeURIComponent(referralLink)}`}
              target="_blank" rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">Share on X / Twitter</Button>
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
              target="_blank" rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">Share on LinkedIn</Button>
            </a>
          </div>

          {/* Commission info box */}
          <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 space-y-1">
            <p className="font-semibold">How commissions work:</p>
            <ul className="list-disc ml-4 space-y-0.5 text-blue-700">
              <li>Starter plan ($19/mo) → you earn <strong>$3.80/mo</strong></li>
              <li>Professional plan ($49/mo) → you earn <strong>$9.80/mo</strong></li>
              <li>Agency plan ($69/mo) → you earn <strong>$13.80/mo</strong></li>
              <li>Commissions accumulate monthly and are paid out manually. Contact us to arrange payment.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* My Referrals Table */}
      {myReferrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Referrals & Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-4">Referred User</th>
                    <th className="text-left py-2 pr-4">Plan</th>
                    <th className="text-left py-2 pr-4">Total Earned</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-left py-2">Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {myReferrals.map(r => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-muted-foreground">{r.referred_email || 'Anonymous visitor'}</td>
                      <td className="py-2 pr-4 capitalize">{r.plan_tier || '—'}</td>
                      <td className="py-2 pr-4 font-medium">
                        {r.status === 'converted' ? `$${(r.total_commission_earned || 0).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status]}`}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2">
                        {r.commission_status ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${commissionStatusColors[r.commission_status]}`}>
                            {r.commission_status}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Panel */}
      {user?.role === 'admin' && (
        <>
          {/* Admin Summary */}
          <div className="border-t pt-6">
            <h2 className="text-base font-semibold mb-4">Admin: Affiliate Commission Management</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Commissions Owed', value: `$${adminPendingPayout.toFixed(2)}`, color: 'text-amber-600' },
                { label: 'Total Paid Out', value: `$${adminPaidOut.toFixed(2)}`, color: 'text-emerald-600' },
                { label: 'Total Commissions (All Time)', value: `$${adminTotalCommissions.toFixed(2)}`, color: 'text-blue-600' },
              ].map(s => (
                <Card key={s.label}>
                  <CardContent className="pt-5 pb-4">
                    <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tab filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {['pending', 'approved', 'paid', 'all'].map(tab => (
                <Button
                  key={tab}
                  variant={adminTab === tab ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAdminTab(tab)}
                  className="capitalize"
                >
                  {tab}
                </Button>
              ))}
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground bg-muted/30">
                        <th className="text-left py-3 px-4">Affiliate</th>
                        <th className="text-left py-3 px-4">Referred</th>
                        <th className="text-left py-3 px-4">Plan</th>
                        <th className="text-left py-3 px-4">Sub Amount</th>
                        <th className="text-left py-3 px-4">Total Earned</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Last Invoice</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdminReferrals.length === 0 && (
                        <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No records found.</td></tr>
                      )}
                      {filteredAdminReferrals.map(r => (
                        <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="py-3 px-4 font-medium">{r.referrer_email}</td>
                          <td className="py-3 px-4 text-muted-foreground">{r.referred_email || '—'}</td>
                          <td className="py-3 px-4 capitalize">{r.plan_tier || '—'}</td>
                          <td className="py-3 px-4">{r.subscription_amount ? `$${r.subscription_amount}/mo` : '—'}</td>
                          <td className="py-3 px-4 font-semibold text-emerald-700">
                            {r.status === 'converted' ? `$${(r.total_commission_earned || 0).toFixed(2)}` : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              r.status !== 'converted' ? statusColors[r.status] : commissionStatusColors[r.commission_status || 'pending']
                            }`}>
                              {r.status !== 'converted' ? r.status.replace('_', ' ') : (r.commission_status || 'pending')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{r.last_invoice_date || '—'}</td>
                          <td className="py-3 px-4">
                            {r.status === 'converted' && r.commission_status !== 'paid' && (
                              <div className="flex gap-1">
                                {r.commission_status !== 'approved' && (
                                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleMarkApproved(r)}>
                                    Approve
                                  </Button>
                                )}
                                <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleMarkPaid(r)}>
                                  Mark Paid
                                </Button>
                              </div>
                            )}
                            {r.commission_status === 'paid' && (
                              <span className="text-xs text-muted-foreground">{r.payout_date || 'Paid'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}