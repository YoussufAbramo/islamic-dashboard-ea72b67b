import { useState, useEffect } from 'react';
import LandingContentSettings from '@/components/settings/LandingContentSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LandingPageManager = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [initialTab, setInitialTab] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === 'pricing') setInitialTab('pricing');
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

      <LandingContentSettings initialTab={initialTab} />
    </div>
  );
};

export default LandingPageManager;
