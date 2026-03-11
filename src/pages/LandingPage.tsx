import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import CopyrightText from '@/components/CopyrightText';
import { DEFAULT_SECTION_ORDER, defaultSectionContent, defaultGeneralContent, defaultNavItems, defaultFooterContent, type SectionKey, type FooterColumn } from '@/lib/landingDefaults';
import { getHeaderComponent, type HeaderStyleKey } from '@/components/landing/LandingHeaders';

// Section components
import HeroSection from '@/components/landing/HeroSection';
import PartnersSection from '@/components/landing/PartnersSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import StatsSection from '@/components/landing/StatsSection';
import CoursesSection from '@/components/landing/CoursesSection';
import WhyUsSection from '@/components/landing/WhyUsSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import InstructorsSection from '@/components/landing/InstructorsSection';
import PricingSection from '@/components/landing/PricingSection';
import FAQSection from '@/components/landing/FAQSection';
import NewsletterSection from '@/components/landing/NewsletterSection';
import CTASection from '@/components/landing/CTASection';

const LandingPage = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { pending } = useAppSettings();
  const { user, profile, signOut } = useAuth();
  const isAr = language === 'ar';
  const [packages, setPackages] = useState<any[]>([]);
  const [content, setContent] = useState<Record<string, Record<string, any>>>(defaultSectionContent);
  const [general, setGeneral] = useState<Record<string, any>>(defaultGeneralContent);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [avatarUrl, setAvatarUrl] = useState('');

  const appName = pending.appName || 'Islamic Dashboard';
  const appLogo = pending.appLogo;
  const favicon = localStorage.getItem('app_favicon') || '';

  useEffect(() => {
    if (favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.href = favicon;
    }
  }, [favicon]);

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [pkgRes, contentRes] = await Promise.all([
        supabase.from('pricing_packages').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('landing_content').select('*'),
      ]);
      if (pkgRes.data) setPackages(pkgRes.data as any);
      if (contentRes.data) {
        const merged = { ...defaultSectionContent };
        let gen = { ...defaultGeneralContent };
        (contentRes.data as any[]).forEach(item => {
          if (item.section_key === 'general') {
            gen = { ...defaultGeneralContent, ...item.content };
          } else {
            merged[item.section_key] = { ...(defaultSectionContent[item.section_key] || {}), ...item.content };
          }
        });
        setContent(merged);
        setGeneral(gen);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (profile?.avatar_url) {
      import('@/lib/storage').then(({ resolveAvatarUrl }) => {
        resolveAvatarUrl(profile.avatar_url).then(setAvatarUrl);
      });
    }
  }, [profile?.avatar_url]);

  const scrollTo = useCallback((id: string) => {
    setMobileMenuOpen(false);
    if (id.startsWith('/')) {
      navigate(id);
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, [navigate]);

  const t = (en: string, ar: string) => isAr ? ar : en;

  // Dynamic section order & visibility
  const sectionsOrder: SectionKey[] = general.sections_order || DEFAULT_SECTION_ORDER;
  const sectionsVisible: Record<string, boolean> = general.sections_visible || {};
  const currencySymbol = pending.currency?.symbol || '$';

  // Dynamic nav items from settings
  const headerStyle: HeaderStyleKey = general.header_style || 'classic';
  const HeaderComponent = getHeaderComponent(headerStyle);

  // Build nav items from settings
  const rawNavItems = general.nav_items || defaultNavItems;
  const resolveItems = (items: any[]) => items.map((item: any) => ({
    label: isAr ? (item.label_ar || item.label) : item.label,
    id: item.id,
  }));

  const navSections = resolveItems(rawNavItems);
  const navSectionsLeft = general.nav_items_left ? resolveItems(general.nav_items_left) : undefined;
  const navSectionsRight = general.nav_items_right ? resolveItems(general.nav_items_right) : undefined;

  const renderSection = (key: SectionKey) => {
    const s = content[key] || defaultSectionContent[key] || {};
    switch (key) {
      case 'hero': return <HeroSection key={key} content={s} isAr={isAr} user={user} statsContent={content.stats} />;
      case 'partners': return <PartnersSection key={key} content={s} isAr={isAr} />;
      case 'features': return <FeaturesSection key={key} content={s} isAr={isAr} />;
      case 'stats': return <StatsSection key={key} content={s} isAr={isAr} />;
      case 'courses': return <CoursesSection key={key} content={s} isAr={isAr} />;
      case 'whyus': return <WhyUsSection key={key} content={s} isAr={isAr} />;
      case 'howitworks': return <HowItWorksSection key={key} content={s} isAr={isAr} />;
      case 'testimonials': return <TestimonialsSection key={key} content={s} isAr={isAr} />;
      case 'instructors': return <InstructorsSection key={key} content={s} isAr={isAr} />;
      case 'pricing': return <PricingSection key={key} content={s} isAr={isAr} packages={packages} currencySymbol={currencySymbol} />;
      case 'faq': return <FAQSection key={key} content={s} isAr={isAr} />;
      case 'newsletter': return <NewsletterSection key={key} content={s} isAr={isAr} />;
      case 'cta': return <CTASection key={key} content={s} isAr={isAr} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <HeaderComponent
        appName={appName}
        appLogo={appLogo}
        navSections={navSections}
        navSectionsLeft={navSectionsLeft}
        navSectionsRight={navSectionsRight}
        scrollTo={scrollTo}
        user={user}
        profile={profile}
        avatarUrl={avatarUrl}
        darkMode={darkMode}
        toggleDark={toggleDark}
        language={language}
        setLanguage={setLanguage}
        isAr={isAr}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        signOut={signOut}
      />

      {/* Dynamic Sections */}
      {sectionsOrder.map(key => {
        if (sectionsVisible[key] === false) return null;
        return renderSection(key);
      })}

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <CopyrightText />
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
