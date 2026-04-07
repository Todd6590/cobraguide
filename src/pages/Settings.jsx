import { useState, useRef, useEffect } from 'react';
import { useSubscription, PLANS } from '@/lib/SubscriptionContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/shared/PageHeader';
import UpgradeDialog from '@/components/subscription/UpgradeDialog';
import { Upload, CheckCircle, Building2, Zap, Image } from 'lucide-react';

export default function Settings() {
  const { plan, tenantSettings, isAgency, currentPlanInfo, user, refreshPlan, setTenantSettings } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Handle return from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      refreshPlan();
      window.history.replaceState({}, '', '/settings');
    }
  }, []);
  const [companyName, setCompanyName] = useState(tenantSettings?.company_name || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await saveTenantSettings({ logo_url: file_url, company_name: companyName });
    } finally {
      setUploading(false);
    }
  };

  const saveTenantSettings = async (overrides = {}) => {
    setSaving(true);
    try {
      const data = {
        user_email: user.email,
        company_name: companyName,
        ...(tenantSettings?.logo_url ? { logo_url: tenantSettings.logo_url } : {}),
        ...overrides,
      };
      let updated;
      if (tenantSettings?.id) {
        updated = await base44.entities.TenantSettings.update(tenantSettings.id, data);
      } else {
        updated = await base44.entities.TenantSettings.create(data);
      }
      setTenantSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader title="Account Settings" description="Manage your subscription and branding" />

      {/* Current Plan */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Subscription Plan</CardTitle>
          <CardDescription>Your current plan and limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border-2 ${currentPlanInfo?.border} ${currentPlanInfo?.bg}`}>
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${currentPlanInfo?.color}`}>{currentPlanInfo?.label}</p>
              <p className="font-semibold text-lg">{currentPlanInfo?.price}</p>
              <p className="text-sm text-muted-foreground">
                {currentPlanInfo?.clientLimit === 0 ? 'Unlimited clients' : `Up to ${currentPlanInfo?.clientLimit} clients`}
              </p>
            </div>
            {plan?.plan_tier !== 'agency' && (
              <Button onClick={() => setUpgradeOpen(true)}>
                <Zap className="w-4 h-4 mr-2" /> Upgrade Plan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Branding — Agency only */}
      <Card className={!isAgency ? 'opacity-60' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-4 h-4 text-purple-500" /> White-Label Branding
            {!isAgency && (
              <span className="ml-2 text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 font-medium">Agency Plan Only</span>
            )}
          </CardTitle>
          <CardDescription>Upload your logo to appear on the dashboard and reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo Upload */}
          <div>
            <Label className="mb-2 block">Company Logo</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/40 overflow-hidden">
                {tenantSettings?.logo_url ? (
                  <img src={tenantSettings.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={!isAgency || uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                </Button>
                <p className="text-xs text-muted-foreground">PNG or JPG, max 5MB</p>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleLogoUpload} />
              </div>
            </div>
          </div>

          {/* Company Name */}
          <div>
            <Label htmlFor="company-name" className="mb-2 block">Brand Name (shown on dashboard & reports)</Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Your Company Name"
              disabled={!isAgency}
              className="max-w-sm"
            />
          </div>

          <Button
            onClick={() => saveTenantSettings()}
            disabled={!isAgency || saving}
            className="flex items-center gap-2"
          >
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : saving ? 'Saving...' : 'Save Branding'}
          </Button>

          {!isAgency && (
            <p className="text-sm text-muted-foreground">
              Upgrade to the <strong>Agency plan</strong> to unlock custom branding.{' '}
              <button onClick={() => setUpgradeOpen(true)} className="text-primary underline underline-offset-2">Upgrade now</button>
            </p>
          )}
        </CardContent>
      </Card>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} currentTier={plan?.plan_tier} />
    </div>
  );
}