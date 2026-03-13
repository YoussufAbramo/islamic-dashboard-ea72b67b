import { useState, useEffect } from 'react';
import LandingContentSettings from '@/components/settings/LandingContentSettings';
import SaaSPricingSettings from '@/components/settings/SaaSPricingSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, DollarSign } from 'lucide-react';

const LandingPageManager = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'content' | 'pricing'>('content');

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === 'pricing') setActiveTab('pricing');
    };
    window.addEventListener('switch-landing-tab', handler);
    return () => window.removeEventListener('switch-landing-tab', handler);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          {isAr ? 'صفحة الهبوط' : 'Landing Page'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr ? 'تخصيص محتوى وإعدادات صفحة الهبوط' : 'Customize landing page content and settings'}
        </p>
      </div>

      {/* Secondary tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'content' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Globe className="h-4 w-4" />
          {isAr ? 'المحتوى' : 'Content'}
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'pricing' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <DollarSign className="h-4 w-4" />
          {isAr ? 'باقات الأسعار' : 'Pricing Packages'}
        </button>
      </div>

      {activeTab === 'content' ? <LandingContentSettings /> : <SaaSPricingSettings />}
    </div>
  );
};

export default LandingPageManager;
