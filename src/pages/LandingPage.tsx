import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Users, GraduationCap, Calendar, Award, BarChart3, MessageSquare, Shield, Star, ChevronRight, Check, Menu, X, BookOpen, Moon, Sun, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CopyrightText from '@/components/CopyrightText';
import islamicPatternHero from '@/assets/other/islamic-pattern-hero.jpg';
import dashboardMockup from '@/assets/other/dashboard-mockup.png';

interface PricingPackage {
  id: string;
  title: string;
  title_ar: string;
  subtitle: string;
  subtitle_ar: string;
  regular_price: number;
  sale_price: number | null;
  billing_cycle: string;
  max_teachers: number;
  max_students: number;
  max_courses: number;
  features: string[];
  is_featured: boolean;
}

interface LandingContent {
  section_key: string;
  content: Record<string, any>;
}

const defaultContent: Record<string, Record<string, any>> = {
  hero: {
    title: 'Islamic Education Platform',
    title_ar: 'منصة التعليم الإسلامي',
    subtitle: 'Empower your institution with a comprehensive learning management system designed for Islamic education',
    subtitle_ar: 'مكّن مؤسستك بنظام إدارة تعليمي شامل مصمم للتعليم الإسلامي',
    cta: 'Get Started',
    cta_ar: 'ابدأ الآن',
  },
  features: {
    title: 'Everything You Need',
    title_ar: 'كل ما تحتاجه',
    subtitle: 'A complete suite of tools for modern Islamic education',
    subtitle_ar: 'مجموعة كاملة من الأدوات للتعليم الإسلامي الحديث',
  },
  whyus: {
    title: 'Why Choose Us?',
    title_ar: 'لماذا تختارنا؟',
    subtitle: 'Built specifically for Islamic educational institutions',
    subtitle_ar: 'مصمم خصيصاً للمؤسسات التعليمية الإسلامية',
    reasons: [
      { title: 'Islamic-First Design', title_ar: 'تصميم إسلامي أولاً', desc: 'Every aspect designed with Islamic aesthetics and values in mind', desc_ar: 'كل جانب مصمم مع مراعاة الجماليات والقيم الإسلامية' },
      { title: 'Bilingual Support', title_ar: 'دعم ثنائي اللغة', desc: 'Full Arabic and English support with RTL layout', desc_ar: 'دعم كامل للعربية والإنجليزية مع تخطيط من اليمين لليسار' },
      { title: 'Comprehensive Tools', title_ar: 'أدوات شاملة', desc: 'From course management to financial reports, everything in one place', desc_ar: 'من إدارة الدورات إلى التقارير المالية، كل شيء في مكان واحد' },
      { title: 'Secure & Reliable', title_ar: 'آمن وموثوق', desc: 'Enterprise-grade security with role-based access control', desc_ar: 'أمان على مستوى المؤسسات مع التحكم في الوصول القائم على الأدوار' },
    ],
  },
  cta: {
    title: 'Ready to Transform Your Institution?',
    title_ar: 'هل أنت مستعد لتحويل مؤسستك؟',
    subtitle: 'Join hundreds of Islamic schools and academies already using our platform',
    subtitle_ar: 'انضم إلى مئات المدارس والأكاديميات الإسلامية التي تستخدم منصتنا بالفعل',
  },
};

const featuresData = [
  { icon: BookOpen, title: 'Course Management', titleAr: 'إدارة الدورات', desc: 'Create and manage courses with sections, lessons, and progress tracking', descAr: 'إنشاء وإدارة الدورات مع الأقسام والدروس وتتبع التقدم' },
  { icon: Users, title: 'Teacher Management', titleAr: 'إدارة المعلمين', desc: 'Manage teachers, schedules, and assign students seamlessly', descAr: 'إدارة المعلمين والجداول وتعيين الطلاب بسلاسة' },
  { icon: GraduationCap, title: 'Student Tracking', titleAr: 'تتبع الطلاب', desc: 'Monitor student progress, attendance, and performance analytics', descAr: 'مراقبة تقدم الطلاب والحضور وتحليلات الأداء' },
  { icon: Calendar, title: 'Smart Timetable', titleAr: 'جدول ذكي', desc: 'Automated scheduling with conflict detection and calendar views', descAr: 'جدولة آلية مع كشف التعارضات وعروض التقويم' },
  { icon: Award, title: 'Certificates', titleAr: 'الشهادات', desc: 'Issue and manage certificates with customizable templates', descAr: 'إصدار وإدارة الشهادات مع قوالب قابلة للتخصيص' },
  { icon: BarChart3, title: 'Reports & Analytics', titleAr: 'التقارير والتحليلات', desc: 'Comprehensive financial and academic reports with export options', descAr: 'تقارير مالية وأكاديمية شاملة مع خيارات التصدير' },
  { icon: MessageSquare, title: 'Communication', titleAr: 'التواصل', desc: 'Built-in chat, announcements, and notification system', descAr: 'محادثات وإعلانات ونظام إشعارات مدمج' },
  { icon: Shield, title: 'Role-Based Access', titleAr: 'وصول قائم على الأدوار', desc: 'Secure admin, teacher, and student roles with fine-grained permissions', descAr: 'أدوار آمنة للمشرف والمعلم والطالب مع أذونات دقيقة' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { pending } = useAppSettings();
  const { user, profile, signOut } = useAuth();
  const isAr = language === 'ar';
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [content, setContent] = useState<Record<string, Record<string, any>>>(defaultContent);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [avatarUrl, setAvatarUrl] = useState('');

  const appName = pending.appName || 'Islamic Dashboard';
  const appLogo = pending.appLogo;
  const favicon = localStorage.getItem('app_favicon') || '';

  // Apply favicon on landing page
  useEffect(() => {
    if (favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
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
        const merged = { ...defaultContent };
        (contentRes.data as LandingContent[]).forEach(item => {
          merged[item.section_key] = { ...defaultContent[item.section_key], ...item.content };
        });
        setContent(merged);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (profile?.avatar_url) {
      import('@/lib/storage').then(({ getAvatarSignedUrl }) => {
        getAvatarSignedUrl(profile.avatar_url).then(setAvatarUrl);
      });
    }
  }, [profile?.avatar_url]);

  const scrollTo = useCallback((id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const filteredPackages = packages.filter(p => p.billing_cycle === billingCycle);
  const c = content;

  const t = (en: string, ar: string) => isAr ? ar : en;
  const ct = (key: string, field: string) => {
    const section = c[key];
    if (!section) return '';
    return isAr ? (section[`${field}_ar`] || section[field]) : section[field];
  };

  const navLinks = [
    { label: t('Home', 'الرئيسية'), id: 'top' },
    { label: t('Features', 'المميزات'), id: 'features' },
    { label: t('Why Us', 'لماذا نحن'), id: 'whyus' },
    { label: t('Pricing', 'الأسعار'), id: 'pricing' },
  ];

  const currencySymbol = pending.currency?.symbol || '$';

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Logo + Nav Links */}
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
                {navLinks.map(link => (
                  <button
                    key={link.id}
                    onClick={() => scrollTo(link.id)}
                    className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="hidden md:flex items-center gap-2">
              <button onClick={toggleDark} className="h-9 w-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="h-9 px-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                {language === 'en' ? 'AR' : 'EN'}
              </button>
              {user ? (
                <div className="flex items-center gap-2 ms-1">
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                        {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
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

            {/* Mobile menu toggle */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-border/40 pt-3 space-y-2">
              {navLinks.map(link => (
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
                  <Button size="sm" className="w-full" onClick={() => navigate('/dashboard')}>
                    {profile?.full_name || 'Dashboard'}
                  </Button>
                ) : (
                  <Button size="sm" className="w-full" onClick={() => navigate('/login')}>
                    {t('Get Started', 'ابدأ الآن')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="top" className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={islamicPatternHero} alt="" className="w-full h-full object-cover opacity-20 dark:opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm">
                <Star className="h-4 w-4" />
                <span>{t('Built for Islamic Education', 'مصمم للتعليم الإسلامي')}</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-amiri leading-tight text-foreground">
                {ct('hero', 'title')}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                {ct('hero', 'subtitle')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate(user ? '/dashboard' : '/login')} className="text-base">
                  {ct('hero', 'cta')} <ChevronRight className="h-5 w-5 ms-2 rtl:-scale-x-100" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => scrollTo('features')} className="text-base">
                  {t('Learn More', 'اعرف المزيد')}
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">500+</div>
                  <div className="text-xs text-muted-foreground">{t('Institutions', 'مؤسسة')}</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">10k+</div>
                  <div className="text-xs text-muted-foreground">{t('Students', 'طالب')}</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">99.9%</div>
                  <div className="text-xs text-muted-foreground">{t('Uptime', 'وقت التشغيل')}</div>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 rounded-2xl bg-primary/5 blur-2xl" />
                <img src={dashboardMockup} alt="Dashboard Preview" className="relative rounded-2xl shadow-2xl border border-border/50" />
              </div>
            </div>
          </div>
        </div>
        <div className="relative h-16">
          <svg viewBox="0 0 1440 60" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0,60 C240,0 480,0 720,30 C960,60 1200,0 1440,60 L1440,60 L0,60 Z" className="fill-background" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">{t('Features', 'المميزات')}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">{ct('features', 'title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{ct('features', 'subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuresData.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Card key={i} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">{isAr ? feature.titleAr : feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{isAr ? feature.descAr : feature.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section id="whyus" className="py-20 md:py-28 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">{t('Why Us', 'لماذا نحن')}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">{ct('whyus', 'title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{ct('whyus', 'subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {(c.whyus?.reasons || defaultContent.whyus.reasons).map((reason: any, i: number) => (
              <div key={i} className="flex gap-4 p-6 rounded-xl bg-background border border-border/50">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{isAr ? reason.title_ar : reason.title}</h3>
                  <p className="text-sm text-muted-foreground">{isAr ? reason.desc_ar : reason.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">{t('Pricing', 'الأسعار')}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">{t('Simple, Transparent Pricing', 'أسعار بسيطة وشفافة')}</h2>
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted mt-4">
              <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                {t('Monthly', 'شهري')}
              </button>
              <button onClick={() => setBillingCycle('yearly')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'yearly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                {t('Yearly', 'سنوي')}
              </button>
            </div>
          </div>
          <div className={`grid gap-6 max-w-5xl mx-auto ${filteredPackages.length <= 3 ? `sm:grid-cols-${Math.min(filteredPackages.length, 3)}` : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
            {filteredPackages.map((pkg) => (
              <Card key={pkg.id} className={`relative flex flex-col ${pkg.is_featured ? 'border-primary shadow-lg scale-[1.02]' : 'border-border/50'}`}>
                {pkg.is_featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">{t('Most Popular', 'الأكثر شعبية')}</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{isAr ? (pkg.title_ar || pkg.title) : pkg.title}</CardTitle>
                  <CardDescription>{isAr ? (pkg.subtitle_ar || pkg.subtitle) : pkg.subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="text-center flex-1">
                  <div className="mb-6">
                    {pkg.sale_price != null && pkg.sale_price < pkg.regular_price ? (
                      <>
                        <span className="text-lg text-muted-foreground line-through">{currencySymbol}{pkg.regular_price}</span>
                        <div className="text-4xl font-bold text-foreground">{currencySymbol}{pkg.sale_price}<span className="text-sm font-normal text-muted-foreground">/{billingCycle === 'yearly' ? t('yr', 'سنة') : t('mo', 'شهر')}</span></div>
                      </>
                    ) : (
                      <div className="text-4xl font-bold text-foreground">{currencySymbol}{pkg.regular_price}<span className="text-sm font-normal text-muted-foreground">/{billingCycle === 'yearly' ? t('yr', 'سنة') : t('mo', 'شهر')}</span></div>
                    )}
                  </div>
                  <ul className="space-y-3 text-sm text-start">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" />{t(`Up to ${pkg.max_teachers} teachers`, `حتى ${pkg.max_teachers} معلم`)}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" />{t(`Up to ${pkg.max_students} students`, `حتى ${pkg.max_students} طالب`)}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" />{t(`Up to ${pkg.max_courses} courses`, `حتى ${pkg.max_courses} دورة`)}</li>
                    {Array.isArray(pkg.features) && pkg.features.map((f: any, i: number) => (
                      <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" />{typeof f === 'string' ? f : f.text || ''}</li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant={pkg.is_featured ? 'default' : 'outline'} onClick={() => navigate('/login')}>
                    {t('Get Started', 'ابدأ الآن')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          {filteredPackages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">{t('No packages available for this billing cycle', 'لا توجد باقات متاحة لهذه الدورة المالية')}</div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-primary/5">
        <div className="mx-auto max-w-3xl px-4 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground">{ct('cta', 'title')}</h2>
          <p className="text-muted-foreground text-lg">{ct('cta', 'subtitle')}</p>
          <Button size="lg" onClick={() => navigate('/login')} className="text-base">
            {t('Start Free Trial', 'ابدأ التجربة المجانية')} <ChevronRight className="h-5 w-5 ms-2 rtl:-scale-x-100" />
          </Button>
        </div>
      </section>

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
