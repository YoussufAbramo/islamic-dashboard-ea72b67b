import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings, ColorTheme } from '@/contexts/AppSettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Palette, Building2, Coins, Upload, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRef } from 'react';

const Settings = () => {
  const { language } = useLanguage();
  const {
    colorTheme, setColorTheme, themes,
    currency, setCurrency, currencies,
    appName, setAppName,
    appDescription, setAppDescription,
    appLogo, setAppLogo,
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

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">{isAr ? 'إعدادات التطبيق' : 'App Settings'}</h1>

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
                onClick={() => setColorTheme(t.value)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  colorTheme === t.value
                    ? 'border-primary shadow-md scale-[1.02]'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className="w-10 h-10 rounded-full" style={{ background: t.color }} />
                <span className="text-xs font-medium">{isAr ? t.labelAr : t.label}</span>
                {colorTheme === t.value && (
                  <Check className="absolute top-2 end-2 h-4 w-4 text-primary" />
                )}
              </button>
            ))}
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
            <Input value={appName} onChange={(e) => setAppName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{isAr ? 'وصف التطبيق' : 'App Description'}</Label>
            <Textarea value={appDescription} onChange={(e) => setAppDescription(e.target.value)} rows={2} />
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
            value={currency.name}
            onValueChange={(v) => {
              const c = currencies.find((c) => c.name === v);
              if (c) setCurrency(c);
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
    </div>
  );
};

export default Settings;
