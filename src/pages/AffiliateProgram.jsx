import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useSubscription } from '@/lib/SubscriptionContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Award, Users, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/shared/PageHeader';

const commissionStatusColors = {
  pending:   'bg-amber-50 text-amber-700',
  approved:  'bg-blue-50 text-blue-700',
  paid:      'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-600',
};

const statusColors = {
  clicked:   'bg-gray-100 text-gray-600',
  signed_up: 'bg-blue-50 text-blue-700',
  converted: 'bg-emerald-50 text-emerald-700',
};

export default function AffiliateProgram() {
  const { user } = useSubscription();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ name: '', email: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [adminTab, setAdminTab] = useState('pending');

  // Check if this user already has an affiliate record
  const { data: myAffiliate } = useQuery({
    queryKey: ['myAffiliate', user?.email],
    queryFn: async () => {
      const results = await base44.entities.Affiliate.filter({ user_email: user?.email });
      return results[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: myReferrals = [] } = useQuery({
    queryKey: ['affiliateReferrals', user?.email],
    queryFn: () => base44.entities.Referral.filter({ referrer_email: user?.email }),
    enabled: !!user?.email && (!!myAffiliate || submitted),
  });

  const { data: allAffiliates = [] } = useQuery({
    queryKey: ['allAffiliates'],
    queryFn: () => base44.entities.Affiliate.list('-created_date', 500),
    enabled: user?.role === 'admin',
  });

  const { data: allReferrals = [] } = useQuery({
    queryKey: ['allReferrals'],
    queryFn: () => base44.entities.Referral.list('-created_date', 500),
    enabled: user?.role === 'admin',
  });

  const updateAffiliateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Affiliate.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allAffiliates'] }),
  });

  const handleApply = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: 'Please fill in your name and email.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      // Save to database
      await base44.entities.Affiliate.create({
        full_name: form.name,
        email: form.email,
        user_email: user?.email || form.email,
        status: 'pending',
        referral_code: (user?.email || form.email).toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_'),
      });
      // Send notification email
      await base44.integrations.Core.SendEmail({
        to: 'help@cobrashieldpro.com',
        subject: '🎉 New Affiliate Program Application',
        body: `A new affiliate application has been submitted:\n\nName: ${form.name}\nEmail: ${form.email}\nAccount Email: ${user?.email || 'Not logged in'}\nDate: ${new Date().toLocaleString()}\n\nLog in to the admin dashboard at app.cobrashieldpro.com/affiliate-program to review and approve.`,
      });
      queryClient.invalidateQueries({ queryKey: ['myAffiliate'] });
      setSubmitted(true);
      toast({ title: 'Application submitted! We\'ll be in touch soon.' });
    } catch {
      toast({ title: 'Submission failed. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = (affiliate, status) => {
    const updates = { status };
    if (status === 'approved') updates.approved_date = new Date().toISOString().split('T')[0];
    updateAffiliateMutation.mutate({ id: affiliate.id, data: updates });
    toast({ title: `Affiliate ${status}.` });
  };

  // My stats
  const converted = myReferrals.filter(r => r.status === 'converted');
  const totalEarned = converted.reduce((sum, r) => sum + (r.total_commission_earned || 0), 0);
  const pendingPayout = converted.filter(r => r.commission_status !== 'paid').reduce((sum, r) => sum + (r.total_commission_earned || 0), 0);

  // Admin stats
  const adminConverted = allReferrals.filter(r => r.status === 'converted');
  const adminTotalCommissions = adminConverted.reduce((sum, r) => sum + (r.total_commission_earned || 0), 0);
  const adminPendingPayout = adminConverted.filter(r => r.commission_status !== 'paid').reduce((sum, r) => sum + (r.total_commission_earned || 0), 0);
  const adminPaidOut = adminConverted.filter(r => r.commission_status === 'paid').reduce((sum, r) => sum + (r.total_commission_earned || 0), 0);

  const filteredAdminReferrals = adminTab === 'all'
    ? allReferrals
    : allReferrals.filter(r => r.commission_status === adminTab || (adminTab === 'pending' && !r.commission_status && r.status === 'converted'));

  const isApproved = !!myAffiliate || submitted;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Affiliate Program"
        description="Earn 20% commission on every subscription payment from users you refer — paid automatically through Stripe."
      />

      {/* Apply section */}
      {!isApproved ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Apply to Become an Affiliate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Fill out the form below to apply. Once approved, you'll receive your unique affiliate link and start earning commissions.
            </p>
            <form onSubmit={handleApply} className="space-y-4 max-w-sm">
              <div className="space-y-1.5">
                <Label htmlFor="aff-name">Your Full Name</Label>
                <Input
                  id="aff-name"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aff-email">Your Email</Label>
                <Input
                  id="aff-email"
                  type="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Application'}
              </Button>
            </form>

            {/* Commission info */}
            <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 space-y-1">
              <p className="font-semibold">How commissions work:</p>
              <ul className="list-disc ml-4 space-y-0.5 text-blue-700">
                <li>Starter plan ($19/mo) → you earn <strong>$3.80/mo</strong></li>
                <li>Professional plan ($49/mo) → you earn <strong>$9.80/mo</strong></li>
                <li>Agency plan ($69/mo) → you earn <strong>$13.80/mo</strong></li>
                <li>Commissions are paid automatically through Stripe.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Submitted / approved state */}
          {submitted && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Application received!</p>
                <p className="text-sm">We'll review your application and reach out soon with your affiliate link and details.</p>
              </div>
            </div>
          )}

          {/* My commission stats */}
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

          {/* Commission info */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 space-y-1">
            <p className="font-semibold">How commissions work:</p>
            <ul className="list-disc ml-4 space-y-0.5 text-blue-700">
              <li>Starter plan ($19/mo) → you earn <strong>$3.80/mo</strong></li>
              <li>Professional plan ($49/mo) → you earn <strong>$9.80/mo</strong></li>
              <li>Agency plan ($69/mo) → you earn <strong>$13.80/mo</strong></li>
              <li>Commissions are paid automatically through Stripe.</li>
            </ul>
          </div>

          {/* My Referrals table */}
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
                            {r.commission_status
                              ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${commissionStatusColors[r.commission_status]}`}>{r.commission_status}</span>
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Admin Panel */}
      {user?.role === 'admin' && (
        <div className="border-t pt-6 space-y-6">
          <h2 className="text-base font-semibold">Admin: Affiliate Management</h2>

          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Applicants', value: allAffiliates.length, color: 'text-blue-600' },
              { label: 'Approved Affiliates', value: allAffiliates.filter(a => a.status === 'approved').length, color: 'text-emerald-600' },
              { label: 'Commissions Owed', value: `$${adminPendingPayout.toFixed(2)}`, color: 'text-amber-600' },
              { label: 'Total Paid Out', value: `$${adminPaidOut.toFixed(2)}`, color: 'text-emerald-600' },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="pt-5 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Affiliate Registry */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Affiliate Registry</h3>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground bg-muted/30">
                        <th className="text-left py-3 px-4">Name</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Referral Code</th>
                        <th className="text-left py-3 px-4">Applied</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allAffiliates.length === 0 && (
                        <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No affiliate applications yet.</td></tr>
                      )}
                      {allAffiliates.map(a => (
                        <tr key={a.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="py-3 px-4 font-medium">{a.full_name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{a.email}</td>
                          <td className="py-3 px-4 font-mono text-xs">{a.referral_code || '—'}</td>
                          <td className="py-3 px-4 text-muted-foreground">{a.created_date ? new Date(a.created_date).toLocaleDateString() : '—'}</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              a.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                              a.status === 'rejected' ? 'bg-red-50 text-red-600' :
                              'bg-amber-50 text-amber-700'
                            }`}>{a.status}</span>
                          </td>
                          <td className="py-3 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {a.status !== 'approved' && <DropdownMenuItem onClick={() => handleStatusChange(a, 'approved')}>Approve</DropdownMenuItem>}
                                {a.status !== 'rejected' && <DropdownMenuItem onClick={() => handleStatusChange(a, 'rejected')} className="text-destructive">Reject</DropdownMenuItem>}
                                {a.status !== 'pending' && <DropdownMenuItem onClick={() => handleStatusChange(a, 'pending')}>Reset to Pending</DropdownMenuItem>}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Commission Report */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Commission Report</h3>
            <div className="flex gap-2 flex-wrap mb-3">
              {['pending', 'approved', 'paid', 'all'].map(tab => (
                <Button key={tab} variant={adminTab === tab ? 'default' : 'outline'} size="sm" onClick={() => setAdminTab(tab)} className="capitalize">
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
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdminReferrals.length === 0 && (
                        <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No records found.</td></tr>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}