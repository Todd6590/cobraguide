import { useState, useRef, useEffect } from 'react';
import { useSubscription } from '@/lib/SubscriptionContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/shared/PageHeader';
import { Upload, CheckCircle, Building2, Zap, Image } from 'lucide-react';
import TeamManagement from '@/components/settings/TeamManagement';

export default function Settings() {
  const { tenantSettings, user, refreshPlan, setTenantSettings } = useSubscription();

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
      <PageHeader title="Account Settings" description="Manage your account and branding" />

      {/* Subscription */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Subscription</CardTitle>
          <CardDescription>Your current plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border-2 border-blue-200 bg-blue-50">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">COBRA Shield Pro</p>
              <p className="font-semibold text-lg">$19/mo</p>
              <p className="text-sm text-muted-foreground">Unlimited clients &amp; beneficiaries</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-4 h-4 text-purple-500" /> White-Label Branding
          </CardTitle>
          <CardDescription>Upload your logo to appear on the dashboard and reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
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
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                </Button>
                <p className="text-xs text-muted-foreground">PNG or JPG, max 5MB</p>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleLogoUpload} />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="company-name" className="mb-2 block">Brand Name (shown on dashboard &amp; reports)</Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Your Company Name"
              className="max-w-sm"
            />
          </div>

          <Button
            onClick={() => saveTenantSettings()}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : saving ? 'Saving...' : 'Save Branding'}
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6">
        <TeamManagement />
      </div>
    </div>
  );
}