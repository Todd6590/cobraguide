import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, CheckCircle2, Users, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function TeamAccept() {
  const [step, setStep] = useState('loading'); // loading | signin | profile | done
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        setStep('signin');
        return;
      }
      const me = await base44.auth.me();
      setUser(me);
      setFullName(me.full_name || '');

      // Find their team membership
      const memberships = await base44.entities.TeamMember.filter({ member_email: me.email, status: 'active' });
      if (memberships.length > 0) {
        setMembership(memberships[0]);
      }

      // If they already have a full name, skip to done
      if (me.full_name) {
        setStep('done');
      } else {
        setStep('profile');
      }
    };
    init();
  }, []);

  const handleSignIn = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) { setError('Please enter your name.'); return; }
    setSaving(true);
    setError('');
    await base44.auth.updateMe({ full_name: fullName.trim() });
    setStep('done');
    setSaving(false);
  };

  if (step === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xl font-bold tracking-tight">COBRA Shield Pro</span>
        </div>

        {step === 'signin' && (
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <CardTitle className="text-xl">You've been invited!</CardTitle>
              <CardDescription className="text-sm mt-1">
                Sign in or create your account to join your team on COBRA Shield Pro.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <Button className="w-full" size="lg" onClick={handleSignIn}>
                Sign In / Create Account <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                After signing in, you'll be brought back here to complete your profile.
              </p>
            </CardContent>
          </Card>
        )}

        {step === 'profile' && (
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Users className="w-7 h-7 text-green-600" />
              </div>
              <CardTitle className="text-xl">Complete Your Profile</CardTitle>
              <CardDescription className="text-sm mt-1">
                {membership
                  ? <>You've been invited to join <strong>{membership.owner_email}</strong>'s team as a <strong>{membership.role}</strong>.</>
                  : "You've been invited to join a team on COBRA Shield Pro."}
                {' '}Just set your name to get started.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Your Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Jane Smith"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
                  autoFocus
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Email</Label>
                <Input value={user?.email || ''} disabled className="bg-muted" />
              </div>
              <Button className="w-full" size="lg" onClick={handleSaveProfile} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <>Complete Setup <ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'done' && (
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <CardTitle className="text-xl">You're all set!</CardTitle>
              <CardDescription className="text-sm mt-1">
                Welcome{user?.full_name ? `, ${user.full_name}` : ''}! Your account is ready.
                {membership && (
                  <span className="block mt-1">
                    You have <strong>{membership.role}</strong> access to {membership.owner_email}'s team.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button className="w-full" size="lg" onClick={() => window.location.href = '/'}>
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}