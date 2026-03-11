import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Button } from '@/components/ui/button';
import { Save, Undo2, Palette, CreditCard, Database, ShieldCheck, Settings2, Globe, DollarSign, HardDrive, GraduationCap, BarChart3, Code } from 'lucide-react';
import { toast } from 'sonner';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import PaymentGatewayCard from '@/components/settings/PaymentGatewayCard';
import DataManagementCard from '@/components/settings/DataManagementCard';
import AuthenticationSettings from '@/components/settings/AuthenticationSettings';
import GeneralSettings from '@/components/settings/GeneralSettings';
import LandingContentSettings from '@/components/settings/LandingContentSettings';
import SaaSPricingSettings from '@/components/settings/SaaSPricingSettings';
import BackupsSettings from '@/components/settings/BackupsSettings';
import EducationSystemSettings from '@/components/settings/EducationSystemSettings';
import PixelsIntegrationSettings from '@/components/settings/PixelsIntegrationSettings';

type SettingsTab = 'general' | 'appearance' | 'auth' | 'payment' | 'data' | 'landing' | 'pricing' | 'backups' | 'education' | 'pixels';

const Settings = () => {
  const { language } = useLanguage();
  const { role } = useAuth();
  const { saveSettings, hasPendingChanges, discardChanges } = useAppSettings();
  const isAr = language === 'ar';
  const isAdmin = role === 'admin';
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Auto-discard pending changes when leaving settings
  useEffect(() => {
    return () => {
      // On unmount, discard any unsaved changes
      discardChanges();
    };
  }, [discardChanges]);

  const handleSave = () => {
    saveSettings();
    toast.success(isAr ? 'تم حفظ الإعدادات' : 'Settings saved successfully');
  };

  const tabs: { value: SettingsTab; label: string; labelAr: string; icon: any; adminOnly?: boolean; comingSoon?: boolean }[] = [
    { value: 'general', label: 'General', labelAr: 'عام', icon: Settings2 },
    { value: 'appearance', label: 'Appearance', labelAr: 'المظهر', icon: Palette },
    { value: 'education', label: 'Education System', labelAr: 'النظام التعليمي', icon: GraduationCap },
    { value: 'landing', label: 'Landing Page', labelAr: 'صفحة الهبوط', icon: Globe, adminOnly: true },
    { value: 'pricing', label: 'Pricing Packages', labelAr: 'باقات الأسعار', icon: DollarSign, adminOnly: true },
    { value: 'pixels', label: 'Pixels & Tracking', labelAr: 'البيكسل والتتبع', icon: BarChart3, adminOnly: true },
    { value: 'auth', label: 'Authentication', labelAr: 'المصادقة', icon: ShieldCheck, adminOnly: true },
    { value: 'payment', label: 'Payment Methods', labelAr: 'طرق الدفع', icon: CreditCard, adminOnly: true },
    { value: 'data', label: 'Data Management', labelAr: 'إدارة البيانات', icon: Database, adminOnly: true },
    { value: 'backups', label: 'Backups', labelAr: 'النسخ الاحتياطية', icon: HardDrive, adminOnly: true },
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

      {/* Vertical sidebar layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Vertical Navigation */}
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
                  {tab.comingSoon && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted-foreground/20 text-muted-foreground ms-auto">
                      {isAr ? 'قريباً' : 'Soon'}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'education' && <EducationSystemSettings />}
          {activeTab === 'landing' && isAdmin && <LandingContentSettings />}
          {activeTab === 'pricing' && isAdmin && <SaaSPricingSettings />}
          {activeTab === 'auth' && isAdmin && <AuthenticationSettings />}
          {activeTab === 'payment' && isAdmin && <PaymentGatewayCard isAr={isAr} />}
          {activeTab === 'data' && isAdmin && <DataManagementCard isAr={isAr} />}
          {activeTab === 'backups' && isAdmin && <BackupsSettings />}
          {activeTab === 'pixels' && isAdmin && <PixelsIntegrationSettings />}
        </div>
      </div>

      {/* Fixed save bar */}
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
