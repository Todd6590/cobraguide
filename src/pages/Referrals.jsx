import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useSubscription } from '@/lib/SubscriptionContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Gift, Users, TrendingUp, Award } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/shared/PageHeader';

function getReferralCode(email) {
  return email?.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_') || '';
}

export default function Referrals() {
  const { user } = useSubscription();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const referralCode = getReferralCode(user?.email);
  const referralLink = `https://cobrashieldpro.com/?ref=${referralCode}`;

  const { data: myReferrals = [] } = useQuery({
    queryKey: ['referrals', user?.email],
    queryFn: () => base44.entities.Referral.filter({ referrer_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: allReferrals = [] } = useQuery({
    queryKey: ['allReferrals'],
    queryFn: () => base44.entities.Referral.list('-created_date', 200),
    enabled: user?.role === 'admin',
  });

  const signedUp = myReferrals.filter(r => ['signed_up', 'converted'].includes(r.status)).length;
  const converted = myReferrals.filter(r => r.status === 'converted').length;
  const rewardsEarned = myReferrals.filter(r => r.reward_applied).length;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: 'Referral link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColors = {
    clicked: 'bg-gray-100 text-gray-600',
    signed_up: 'bg-blue-50 text-blue-700',
    converted: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Referral Program"
        description="Earn 1 free month for every new subscriber you refer."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Referral Signups', value: signedUp, icon: Users, color: 'text-blue-600' },
          { label: 'Converted to Paid', value: converted, icon: TrendingUp, color: 'text-emerald-600' },
          { label: 'Free Months Earned', value: rewardsEarned, icon: Gift, color: 'text-purple-600' },
          { label: 'Pending Rewards', value: converted - rewardsEarned, icon: Award, color: 'text-amber-600' },
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
          <CardTitle className="text-base">Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Share this link. When someone signs up and subscribes to a paid plan, you automatically get <strong>1 free month</strong> applied to your next billing cycle.
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
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">Share on X / Twitter</Button>
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">Share on LinkedIn</Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* My Referrals Table */}
      {myReferrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myReferrals.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <span className="text-muted-foreground">{r.referred_email || 'Anonymous visitor'}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status]}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                    {r.reward_applied && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium flex items-center gap-1">
                        <Gift className="w-3 h-3" /> Reward Applied
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin: All Referrals */}
      {user?.role === 'admin' && allReferrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin: All Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-4">Referrer</th>
                    <th className="text-left py-2 pr-4">Referred</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-left py-2">Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {allReferrals.map(r => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{r.referrer_email}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{r.referred_email || '—'}</td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status]}`}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2">
                        {r.reward_applied
                          ? <span className="text-xs text-emerald-600 font-medium">✓ Applied</span>
                          : <span className="text-xs text-muted-foreground">Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}