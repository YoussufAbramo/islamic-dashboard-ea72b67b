import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Button } from '@/components/ui/button';
import { Save, Undo2, Palette, CreditCard, Database, ShieldCheck, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import PaymentGatewayCard from '@/components/settings/PaymentGatewayCard';
import DataManagementCard from '@/components/settings/DataManagementCard';
import AuthenticationSettings from '@/components/settings/AuthenticationSettings';
import GeneralSettings from '@/components/settings/GeneralSettings';

type SettingsTab = 'appearance' | 'payment' | 'data' | 'auth' | 'general';

const Settings = () => {
  const { language } = useLanguage();
  const { role } = useAuth();
  const { saveSettings, hasPendingChanges, discardChanges } = useAppSettings();
  const isAr = language === 'ar';
  const isAdmin = role === 'admin';
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

  const handleSave = () => {
    saveSettings();
    toast.success(isAr ? 'تم حفظ الإعدادات' : 'Settings saved successfully');
  };

  const tabs: { value: SettingsTab; label: string; labelAr: string; icon: any; adminOnly?: boolean }[] = [
    { value: 'appearance', label: 'Appearance', labelAr: 'المظهر', icon: Palette },
    { value: 'payment', label: 'Payment Methods', labelAr: 'طرق الدفع', icon: CreditCard, adminOnly: true },
    { value: 'data', label: 'Data Management', labelAr: 'إدارة البيانات', icon: Database, adminOnly: true },
    { value: 'auth', label: 'Authentication', labelAr: 'المصادقة', icon: ShieldCheck, adminOnly: true },
    { value: 'general', label: 'General', labelAr: 'عام', icon: Settings2 },
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

      {/* Secondary Navigation */}
      <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-muted">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {isAr ? tab.labelAr : tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="max-w-3xl">
        {activeTab === 'appearance' && <AppearanceSettings />}
        {activeTab === 'payment' && isAdmin && <PaymentGatewayCard isAr={isAr} />}
        {activeTab === 'data' && isAdmin && <DataManagementCard isAr={isAr} />}
        {activeTab === 'auth' && isAdmin && <AuthenticationSettings />}
        {activeTab === 'general' && <GeneralSettings />}
      </div>

      {/* Sticky save bar */}
      {hasPendingChanges && (
        <div className="sticky bottom-4 flex justify-end gap-2 p-3 rounded-lg border bg-card shadow-lg">
          <span className="text-sm text-muted-foreground flex items-center me-auto">{isAr ? 'لديك تغييرات غير محفوظة' : 'You have unsaved changes'}</span>
          <Button variant="outline" size="sm" onClick={discardChanges}>{isAr ? 'تراجع' : 'Discard'}</Button>
          <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 me-1" />{isAr ? 'حفظ' : 'Save'}</Button>
        </div>
      )}
    </div>
  );
};

export default Settings;
