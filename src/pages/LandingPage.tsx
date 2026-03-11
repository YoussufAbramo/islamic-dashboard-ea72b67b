import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronRight, Menu, X, BookOpen, Moon, Sun, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CopyrightText from '@/components/CopyrightText';
import { DEFAULT_SECTION_ORDER, defaultSectionContent, defaultGeneralContent, type SectionKey } from '@/lib/landingDefaults';

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
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const t = (en: string, ar: string) => isAr ? ar : en;

  // Dynamic section order & visibility
  const sectionsOrder: SectionKey[] = general.sections_order || DEFAULT_SECTION_ORDER;
  const sectionsVisible: Record<string, boolean> = general.sections_visible || {};
  const currencySymbol = pending.currency?.symbol || '$';

  // Visible nav sections
  const navSections: { label: string; id: string }[] = [];
  if (sectionsVisible.hero !== false) navSections.push({ label: t('Home', 'الرئيسية'), id: 'top' });
  if (sectionsVisible.features !== false) navSections.push({ label: t('Features', 'المميزات'), id: 'features' });
  if (sectionsVisible.courses !== false) navSections.push({ label: t('Courses', 'الدورات'), id: 'courses' });
  if (sectionsVisible.pricing !== false) navSections.push({ label: t('Pricing', 'الأسعار'), id: 'pricing' });
  if (sectionsVisible.faq !== false) navSections.push({ label: t('FAQ', 'الأسئلة'), id: 'faq' });

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
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <button onClick={() => scrollTo('top')} className="flex items-center gap-2 shrink-0">
                {appLogo ? (
                  <img src={appLogo} alt={appName} className="h-8 max-w-[140px] object-contain" />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-foreground hidden sm:block">{appName}</span>
                  </div>
                )}
              </button>
              <div className="hidden md:flex items-center gap-1">
                {navSections.map(link => (
                  <button key={link.id} onClick={() => scrollTo(link.id)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted">
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <button onClick={toggleDark} className="h-9 w-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="h-9 w-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <span className="text-sm font-bold leading-none" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>ع</span>
              </button>
              {user ? (
                <div className="flex items-center gap-2 ms-1">
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px]">{profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    {profile?.full_name || 'Dashboard'}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={async () => { await signOut(); navigate('/login'); }}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => navigate('/login')} className="ms-1">
                  {t('Get Started', 'ابدأ الآن')} <ChevronRight className="h-4 w-4 ms-1 rtl:-scale-x-100" />
                </Button>
              )}
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-border/40 pt-3 space-y-2">
              {navSections.map(link => (
                <button key={link.id} onClick={() => scrollTo(link.id)} className="block w-full text-start px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted">
                  {link.label}
                </button>
              ))}
              <div className="flex gap-2 px-3 pt-2">
                <button onClick={toggleDark} className="h-9 w-9 rounded-md border border-border flex items-center justify-center text-muted-foreground">
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="h-9 px-3 rounded-md border border-border text-sm text-muted-foreground">
                  {language === 'en' ? 'العربية' : 'English'}
                </button>
              </div>
              <div className="px-3 pt-1">
                {user ? (
                  <Button size="sm" className="w-full" onClick={() => navigate('/dashboard')}>{profile?.full_name || 'Dashboard'}</Button>
                ) : (
                  <Button size="sm" className="w-full" onClick={() => navigate('/login')}>{t('Get Started', 'ابدأ الآن')}</Button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

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
