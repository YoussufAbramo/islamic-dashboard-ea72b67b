import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import CopyrightBar, { defaultCopyrightConfig } from '@/components/landing/CopyrightBar';
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

      {/* Dynamic Footer */}
      {(() => {
        const ft = general.footer || defaultFooterContent;
        const colsCount = ft.columns_count || 3;
        const allCols: FooterColumn[] = (ft.columns || []).slice(0, colsCount);
        const ftTitle = isAr ? (ft.title_ar || ft.title) : ft.title;
        const ftDesc = isAr ? (ft.description_ar || ft.description) : ft.description;
        const darkLogo = pending.darkLogo || localStorage.getItem('app_dark_logo') || '';
        const logoSource = ft.logo_source || 'dark';
        const footerLogo = logoSource === 'light' ? appLogo : logoSource === 'favicon' ? favicon : darkLogo;
        const brandingCol: number = ft.branding_column ?? 0;
        const socialCol: number = ft.social_column ?? -1;
        const hasBranding = !!(footerLogo || ftTitle || ftDesc);

        const gridCols = colsCount === 1 ? 'grid-cols-1' : colsCount === 2 ? 'sm:grid-cols-2' : colsCount === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';

        // Social media icons from app settings
        const socialLinks = (pending.socialLinks || {}) as Record<string, string>;
        const socialIcons: { key: string; url: string; icon: React.ReactNode }[] = [
          { key: 'facebook', url: socialLinks.facebook, icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
          { key: 'twitter', url: socialLinks.twitter, icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
          { key: 'instagram', url: socialLinks.instagram, icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
          { key: 'youtube', url: socialLinks.youtube, icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
          { key: 'linkedin', url: socialLinks.linkedin, icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
          { key: 'tiktok', url: socialLinks.tiktok, icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg> },
          { key: 'telegram', url: socialLinks.telegram, icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> },
          { key: 'whatsapp', url: socialLinks.whatsapp, icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
        ].filter(s => s.url);

        const renderSocialIcons = () => {
          if (socialIcons.length === 0) return null;
          return (
            <div className="flex items-center gap-2 mt-3">
              {socialIcons.map(s => (
                <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  {s.icon}
                </a>
              ))}
            </div>
          );
        };

        const renderBranding = () => (
          <div className="space-y-3">
            {footerLogo && <img src={footerLogo} alt={ftTitle || appName} className="h-10 max-w-[180px] object-contain" />}
            {ftTitle && <h3 className="text-lg font-bold text-foreground">{ftTitle}</h3>}
            {ftDesc && <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">{ftDesc}</p>}
          </div>
        );

        const renderColumn = (col: FooterColumn, ci: number, skipSocial = false) => (
          <div key={ci}>
            {(isAr ? (col.title_ar || col.title) : col.title) && (
              <h4 className="text-sm font-semibold text-foreground mb-3">{isAr ? (col.title_ar || col.title) : col.title}</h4>
            )}
            <ul className="space-y-2">
              {col.items.map((link, li) => (
                <li key={li}>
                  <a
                    href={link.url}
                    onClick={e => {
                      if (link.url.startsWith('#')) {
                        e.preventDefault();
                        scrollTo(link.url.slice(1));
                      } else if (link.url.startsWith('/')) {
                        e.preventDefault();
                        navigate(link.url);
                      }
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isAr ? (link.label_ar || link.label) : link.label}
                  </a>
                </li>
              ))}
            </ul>
            {!skipSocial && socialCol === ci && renderSocialIcons()}
          </div>
        );

        return (
          <footer className="py-12 border-t border-border bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className={`grid gap-8 ${gridCols}`}>
                {allCols.map((col, ci) => (
                  ci === brandingCol && hasBranding ? (
                    <div key={ci} className="space-y-6">
                      {renderBranding()}
                      {socialCol === ci && renderSocialIcons()}
                      {col.items.length > 0 && renderColumn(col, ci, true)}
                    </div>
                  ) : renderColumn(col, ci)
                ))}
              </div>

              <div className="mt-10 pt-6 border-t border-border/50">
                <CopyrightBar config={ft.copyright || defaultCopyrightConfig} isAr={isAr} />
              </div>
            </div>
          </footer>
        );
      })()}
    </div>
  );
};

export default LandingPage;
