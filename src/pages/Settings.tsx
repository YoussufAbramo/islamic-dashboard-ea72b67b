import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings, LTR_FONTS, RTL_FONTS } from '@/contexts/AppSettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Palette, Building2, Coins, Upload, Check, Type, Save, Undo2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRef } from 'react';

const Settings = () => {
  const { language } = useLanguage();
  const {
    pending, updatePending, saveSettings, hasPendingChanges, discardChanges,
    themes, currencies, setAppLogo, appLogo,
  } = useAppSettings();
  const isAr = language === 'ar';
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const path = `branding/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setAppLogo(data.publicUrl);
    toast.success(isAr ? 'تم رفع الشعار' : 'Logo uploaded');
  };

  const handleSave = () => {
    saveSettings();
    toast.success(isAr ? 'تم حفظ الإعدادات' : 'Settings saved successfully');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{isAr ? 'إعدادات التطبيق' : 'App Settings'}</h1>
        <div className="flex gap-2">
          {hasPendingChanges && (
            <Button variant="outline" onClick={discardChanges} size="sm">
              <Undo2 className="h-4 w-4 me-1" />
              {isAr ? 'تراجع' : 'Discard'}
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasPendingChanges} size="sm">
            <Save className="h-4 w-4 me-1" />
            {isAr ? 'حفظ التغييرات' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Color Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            {isAr ? 'سمة الألوان' : 'Color Theme'}
          </CardTitle>
          <CardDescription>{isAr ? 'اختر نظام ألوان التطبيق' : 'Choose the app color scheme'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => updatePending({ colorTheme: t.value })}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  pending.colorTheme === t.value
                    ? 'border-primary shadow-md scale-[1.02]'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className="w-10 h-10 rounded-full" style={{ background: t.color }} />
                <span className="text-xs font-medium">{isAr ? t.labelAr : t.label}</span>
                {pending.colorTheme === t.value && (
                  <Check className="absolute top-2 end-2 h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fonts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5 text-primary" />
            {isAr ? 'الخطوط' : 'Fonts'}
          </CardTitle>
          <CardDescription>{isAr ? 'اختر خطوط التطبيق للغة العربية والإنجليزية' : 'Choose app fonts for LTR and RTL languages'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isAr ? 'خط LTR (الإنجليزية)' : 'LTR Font (English)'}</Label>
              <Select value={pending.ltrFont} onValueChange={(v) => updatePending({ ltrFont: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LTR_FONTS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <span style={{ fontFamily: f.value }}>{f.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: pending.ltrFont }}>
                Preview: The quick brown fox jumps over the lazy dog.
              </p>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'خط RTL (العربية)' : 'RTL Font (Arabic)'}</Label>
              <Select value={pending.rtlFont} onValueChange={(v) => updatePending({ rtlFont: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RTL_FONTS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <span style={{ fontFamily: f.value }}>{f.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground" dir="rtl" style={{ fontFamily: pending.rtlFont }}>
                معاينة: هذا نص تجريبي لمعاينة الخط العربي المختار.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {isAr ? 'العلامة التجارية' : 'Branding'}
          </CardTitle>
          <CardDescription>{isAr ? 'خصص اسم التطبيق والشعار والوصف' : 'Customize app name, logo, and description'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{isAr ? 'اسم التطبيق' : 'App Name'}</Label>
            <Input value={pending.appName} onChange={(e) => updatePending({ appName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{isAr ? 'وصف التطبيق' : 'App Description'}</Label>
            <Textarea value={pending.appDescription} onChange={(e) => updatePending({ appDescription: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>{isAr ? 'شعار التطبيق' : 'App Logo'}</Label>
            <div className="flex items-center gap-4">
              {appLogo ? (
                <img src={appLogo} alt="Logo" className="h-14 w-14 rounded-lg object-cover border border-border" />
              ) : (
                <div className="h-14 w-14 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  {isAr ? 'رفع شعار' : 'Upload Logo'}
                </Button>
                {appLogo && (
                  <Button variant="ghost" size="sm" onClick={() => setAppLogo('')}>
                    {isAr ? 'إزالة' : 'Remove'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            {isAr ? 'العملة' : 'Currency'}
          </CardTitle>
          <CardDescription>{isAr ? 'اختر العملة الافتراضية' : 'Choose the default currency'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={pending.currency.name}
            onValueChange={(v) => {
              const c = currencies.find((c) => c.name === v);
              if (c) updatePending({ currency: c });
            }}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.symbol} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Sticky save bar */}
      {hasPendingChanges && (
        <div className="sticky bottom-4 flex justify-end gap-2 p-3 rounded-lg border bg-card shadow-lg">
          <span className="text-sm text-muted-foreground flex items-center me-auto">
            {isAr ? 'لديك تغييرات غير محفوظة' : 'You have unsaved changes'}
          </span>
          <Button variant="outline" size="sm" onClick={discardChanges}>
            {isAr ? 'تراجع' : 'Discard'}
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 me-1" />
            {isAr ? 'حفظ' : 'Save'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Settings;
