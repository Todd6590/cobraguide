import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSubscription } from '@/lib/SubscriptionContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Gift, Users, TrendingUp, ExternalLink } from 'lucide-react';
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

  const converted = myReferrals.filter(r => r.status === 'converted');
  const rewarded = converted.filter(r => r.reward_applied);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: 'Referral link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Refer a Friend"
        description="Share COBRA Shield Pro and earn a free month for every friend who subscribes."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Referrals', value: myReferrals.length, icon: Users, color: 'text-blue-600' },
          { label: 'Converted to Paid', value: converted.length, icon: TrendingUp, color: 'text-emerald-600' },
          { label: 'Free Months Earned', value: rewarded.length, icon: Gift, color: 'text-purple-600' },
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

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">1</span>
            <p>Share your unique referral link with a colleague or contact.</p>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">2</span>
            <p>They sign up and start a paid subscription to COBRA Shield Pro.</p>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">3</span>
            <p>You receive <strong>one free month</strong> automatically applied to your next billing cycle.</p>
          </div>
        </CardContent>
      </Card>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
        </CardContent>
      </Card>

      {/* My Referrals */}
      {myReferrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-4">Referred User</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-left py-2">Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {myReferrals.map(r => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-muted-foreground">{r.referred_email || 'Anonymous visitor'}</td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status]}`}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2">
                        {r.reward_applied
                          ? <Badge className="bg-emerald-50 text-emerald-700 text-xs">Free month applied</Badge>
                          : r.status === 'converted'
                          ? <span className="text-xs text-amber-600">Pending</span>
                          : <span className="text-xs text-muted-foreground">—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Affiliate Program link */}
      <div className="border border-blue-100 bg-blue-50 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800 text-sm">Want to earn ongoing commissions?</p>
          <p className="text-sm text-slate-600 mt-0.5">Apply for our Affiliate Program and earn 20% on every subscription payment — paid automatically through Stripe.</p>
        </div>
        <Link to="/affiliate-program" className="flex-shrink-0">
          <Button className="gap-2 whitespace-nowrap">
            Affiliate Program <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}