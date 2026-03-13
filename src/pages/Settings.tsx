import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Button } from '@/components/ui/button';
import { Save, Undo2, Palette, CreditCard, Database, ShieldCheck, Settings2, Globe, HardDrive, GraduationCap, BarChart3, Code, Search as SearchIcon, Cloud, Webhook } from 'lucide-react';
import { toast } from 'sonner';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import PaymentGatewayCard from '@/components/settings/PaymentGatewayCard';
import DataManagementCard from '@/components/settings/DataManagementCard';
import AuthenticationSettings from '@/components/settings/AuthenticationSettings';
import GeneralSettings from '@/components/settings/GeneralSettings';

import BackupsSettings from '@/components/settings/BackupsSettings';
import EducationSystemSettings from '@/components/settings/EducationSystemSettings';
import PixelsIntegrationSettings from '@/components/settings/PixelsIntegrationSettings';
import SeoSettings from '@/components/settings/SeoSettings';
import SupabaseStatusSettings from '@/components/settings/SupabaseStatusSettings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ComingSoonOverlay from '@/components/ComingSoonOverlay';

const DeveloperSettings = () => {
  const { language } = useLanguage();
  const { pending, setDeveloperMode } = useAppSettings();
  const developerMode = pending.developerMode;
  const isAr = language === 'ar';
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAr ? 'وضع المطور' : 'Developer Mode'}</CardTitle>
        <CardDescription>{isAr ? 'تفعيل أدوات المطور في القائمة الرئيسية' : 'Enable developer tools in the main menu'}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label htmlFor="dev-mode">{isAr ? 'تفعيل وضع المطور' : 'Enable Developer Mode'}</Label>
          <Switch id="dev-mode" checked={developerMode} onCheckedChange={setDeveloperMode} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{isAr ? 'عند التفعيل، ستظهر فئة "المطور" في القائمة الرئيسية مع توثيق الأخطاء وسجل الويب هوك.' : 'When enabled, the "Developer" category will appear in the main menu with Error Documentation and Webhook Log.'}</p>
      </CardContent>
    </Card>
  );
};

const WebsiteModeSettings = () => {
  const { language } = useLanguage();
  const { pending, setWebsiteMode } = useAppSettings();
  const websiteMode = pending.websiteMode;
  const isAr = language === 'ar';
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              {isAr ? 'وضع الموقع' : 'Website Mode'}
              <Badge variant={websiteMode ? 'default' : 'secondary'} className="text-[10px]">
                {websiteMode ? (isAr ? 'مفعّل' : 'Active') : (isAr ? 'معطّل' : 'Inactive')}
              </Badge>
            </CardTitle>
            <CardDescription>{isAr ? 'التحكم في ظهور الموقع العام' : 'Control public website visibility'}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-1">
            <Label htmlFor="website-mode" className="text-sm font-medium">{isAr ? 'تفعيل الموقع العام' : 'Enable Public Website'}</Label>
            <p className="text-xs text-muted-foreground max-w-md">
              {isAr
                ? 'عند التفعيل، سيتم عرض صفحة الهبوط والمدونة والسياسات وجميع الصفحات العامة. عند التعطيل، سيتم إعادة توجيه الزوار إلى صفحة إشعار.'
                : 'When enabled, the landing page, blog, policies, and all public pages will be visible. When disabled, visitors will be redirected to a notice page.'}
            </p>
          </div>
          <Switch id="website-mode" checked={websiteMode} onCheckedChange={setWebsiteMode} />
        </div>
        <div className="rounded-lg border border-border p-4 space-y-2">
          <p className="text-sm font-medium text-foreground">{isAr ? '✅ عند التفعيل:' : '✅ When enabled:'}</p>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>{isAr ? 'أقسام الموقع (صفحة الهبوط، السياسات، الصفحات، المدونة) ستظهر في القائمة الرئيسية' : 'Website sections (Landing Page, Policies, Pages, Blog) appear in the sidebar menu'}</li>
            <li>{isAr ? 'الصفحات العامة متاحة للزوار بدون تسجيل دخول' : 'Public pages are accessible to visitors without login'}</li>
            <li>{isAr ? 'يمكن للمشرفين إدارة المحتوى من لوحة التحكم' : 'Administrators can manage content from the dashboard'}</li>
            <li>{isAr ? 'صفحة الاتصال والمدونة والسياسات تكون قابلة للوصول عبر الروابط المباشرة' : 'Contact page, blog archive, and policies are reachable via direct URLs'}</li>
            <li>{isAr ? 'نموذج التسجيل وصفحة التسجيل تكون مرئية' : 'Signup form and registration page are visible to new users'}</li>
            <li>{isAr ? 'إعدادات تحسين محركات البحث (SEO) والبيكسل تكون فعالة على الصفحات العامة' : 'SEO settings and tracking pixels are active on public pages'}</li>
          </ul>
        </div>
        <div className="rounded-lg border border-border p-4 space-y-2">
          <p className="text-sm font-medium text-foreground">{isAr ? '⛔ عند التعطيل:' : '⛔ When disabled:'}</p>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>{isAr ? 'أقسام الموقع ستكون مخفية من القائمة الرئيسية' : 'Website sections are hidden from the sidebar menu'}</li>
            <li>{isAr ? 'الزوار سيرون صفحة "الموقع غير متاح" بدلاً من أي محتوى عام' : 'Visitors see a "Website Unavailable" notice page instead of any public content'}</li>
            <li>{isAr ? 'صفحة تسجيل الدخول تبقى متاحة للمستخدمين المسجلين' : 'Login page remains accessible for registered users'}</li>
            <li>{isAr ? 'لوحة التحكم تعمل بشكل طبيعي للمستخدمين المصرح لهم' : 'Dashboard functions normally for authorized users'}</li>
            <li>{isAr ? 'الروابط المباشرة للمدونة والسياسات وصفحة الاتصال ستعرض صفحة الإشعار' : 'Direct URLs to blog, policies, and contact will show the notice page'}</li>
            <li>{isAr ? 'صفحة التسجيل الذاتي ستكون معطلة' : 'Self-registration / signup page will be disabled'}</li>
            <li>{isAr ? 'محركات البحث لن تتمكن من فهرسة الصفحات العامة' : 'Search engines will not be able to index public pages'}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

type SettingsTab = 'general' | 'appearance' | 'auth' | 'payment' | 'data' | 'backups' | 'education' | 'pixels' | 'seo' | 'supabase' | 'developer' | 'website' | 'webhooks';

const Settings = () => {
  const { language } = useLanguage();
  const { role } = useAuth();
  const { saveSettings, hasPendingChanges, discardChanges } = useAppSettings();
  const isAr = language === 'ar';
  const isAdmin = role === 'admin';
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    const tab = searchParams.get('tab');
    return tab && ['general','appearance','auth','payment','data','backups','education','pixels','seo','supabase','developer','website','webhooks'].includes(tab) ? tab as SettingsTab : 'general';
  });

  // Auto-discard pending changes when leaving settings - use ref to avoid re-running on discardChanges change
  const discardRef = useRef(discardChanges);
  discardRef.current = discardChanges;
  useEffect(() => {
    return () => {
      discardRef.current();
    };
  }, []);

  const handleSave = () => {
    saveSettings();
    toast.success(isAr ? 'تم حفظ الإعدادات' : 'Settings saved successfully');
  };

  const tabs: { value: SettingsTab; label: string; labelAr: string; icon: any; adminOnly?: boolean }[] = [
    { value: 'general', label: 'General', labelAr: 'عام', icon: Settings2 },
    { value: 'appearance', label: 'Appearance', labelAr: 'المظهر', icon: Palette },
    { value: 'education', label: 'Education System', labelAr: 'النظام التعليمي', icon: GraduationCap },
    { value: 'website', label: 'Website Mode', labelAr: 'وضع الموقع', icon: Globe, adminOnly: true },
    
    { value: 'pixels', label: 'Pixels & Tracking', labelAr: 'البيكسل والتتبع', icon: BarChart3, adminOnly: true },
    { value: 'seo', label: 'Advanced SEO', labelAr: 'تحسين محركات البحث', icon: SearchIcon, adminOnly: true },
    { value: 'auth', label: 'Authentication', labelAr: 'المصادقة', icon: ShieldCheck, adminOnly: true },
    { value: 'payment', label: 'Payment Methods', labelAr: 'طرق الدفع', icon: CreditCard, adminOnly: true },
    { value: 'data', label: 'Data Management', labelAr: 'إدارة البيانات', icon: Database, adminOnly: true },
    { value: 'backups', label: 'Backups', labelAr: 'النسخ الاحتياطية', icon: HardDrive, adminOnly: true },
    { value: 'supabase', label: 'Supabase', labelAr: 'Supabase', icon: Cloud, adminOnly: true },
    { value: 'developer', label: 'Developer', labelAr: 'المطور', icon: Code, adminOnly: true },
  ];

  const visibleTabs = tabs.filter(t => !t.adminOnly || isAdmin);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{isAr ? 'إعدادات التطبيق' : 'App Settings'}</h1>
        <div className="flex gap-2">
          {hasPendingChanges && (
            <Button variant="outline" onClick={discardChanges} size="sm">
              <Undo2 className="h-4 w-4 me-1" />{isAr ? 'تراجع' : 'Discard'}
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasPendingChanges} size="sm">
            <Save className="h-4 w-4 me-1" />{isAr ? 'حفظ التغييرات' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-56 shrink-0">
          <nav className="flex flex-row md:flex-col gap-1 p-1 rounded-lg bg-muted overflow-x-auto md:overflow-x-visible">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap w-full text-start ${
                    activeTab === tab.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {isAr ? tab.labelAr : tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'education' && <EducationSystemSettings />}
          {activeTab === 'website' && isAdmin && <WebsiteModeSettings />}
          
          {activeTab === 'auth' && isAdmin && <AuthenticationSettings />}
          {activeTab === 'payment' && isAdmin && <PaymentGatewayCard isAr={isAr} />}
          {activeTab === 'data' && isAdmin && <DataManagementCard isAr={isAr} />}
          {activeTab === 'backups' && isAdmin && <BackupsSettings />}
          {activeTab === 'pixels' && isAdmin && <PixelsIntegrationSettings />}
          {activeTab === 'seo' && isAdmin && <SeoSettings />}
          {activeTab === 'supabase' && isAdmin && <SupabaseStatusSettings />}
          {activeTab === 'developer' && isAdmin && <DeveloperSettings />}
        </div>
      </div>

      {hasPendingChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-3 rounded-lg border bg-card shadow-lg max-w-xl w-[calc(100%-2rem)]">
          <span className="text-sm text-muted-foreground flex items-center me-auto">{isAr ? 'لديك تغييرات غير محفوظة' : 'You have unsaved changes'}</span>
          <Button variant="outline" size="sm" onClick={discardChanges}>{isAr ? 'تراجع' : 'Discard'}</Button>
          <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 me-1" />{isAr ? 'حفظ' : 'Save'}</Button>
        </div>
      )}
    </div>
  );
};

export default Settings;
