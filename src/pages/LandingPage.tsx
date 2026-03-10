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
import islamicPatternHero from '@/assets/islamic-pattern-hero.jpg';
import dashboardMockup from '@/assets/dashboard-mockup.png';

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
  const { user, profile } = useAuth();
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
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <button onClick={() => scrollTo('top')} className="flex items-center gap-2">
              {appLogo ? (
                <img src={appLogo} alt={appName} className="h-8 max-w-[160px] object-contain" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
              )}
            </button>
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50"
                >
                  {link.label}
                </button>
              ))}
              <div className="mx-2 h-6 w-px bg-border" />
              <button onClick={toggleDark} className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors hover:bg-accent/50">
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="text-sm font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors hover:bg-accent/50">
                {language === 'en' ? 'العربية' : 'English'}
              </button>
              <div className="mx-2 h-6 w-px bg-border" />
              {user ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{profile?.full_name || 'User'}</span>
                  </button>
                  <button
                    onClick={async () => { const { signOut } = await import('@supabase/supabase-js').then(() => ({ signOut: async () => { await supabase.auth.signOut(); navigate('/login'); } })); await signOut(); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title={isAr ? 'تسجيل الخروج' : 'Logout'}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Button size="sm" onClick={() => navigate('/login')}>
                  {t('Get Started', 'ابدأ الآن')} <ChevronRight className="h-4 w-4 ms-1" />
                </Button>
              )}
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              {navLinks.map(link => (
                <button key={link.id} onClick={() => scrollTo(link.id)} className="block w-full text-start px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                  {link.label}
                </button>
              ))}
              <div className="flex gap-2 px-4">
                <button onClick={toggleDark} className="p-2 rounded-lg border border-border text-muted-foreground">
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="text-sm px-3 py-1.5 rounded-lg border border-border text-muted-foreground">
                  {language === 'en' ? 'العربية' : 'English'}
                </button>
              </div>
              <div className="flex gap-2 px-4">
                {user ? (
                  <Button size="sm" className="flex-1" onClick={() => navigate('/dashboard')}>
                    <Avatar className="h-5 w-5 me-2">
                      <AvatarFallback className="text-[10px]">{profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    {profile?.full_name || 'Dashboard'}
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1" onClick={() => navigate('/login')}>
                    {t('Get Started', 'ابدأ الآن')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
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
                  {ct('hero', 'cta')} <ChevronRight className="h-5 w-5 ms-2" />
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
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{ct('features', 'subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuresData.map((feature, i) => (
              <Card key={i} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{isAr ? feature.titleAr : feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{isAr ? feature.descAr : feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Islamic Pattern Divider */}
      <div className="relative py-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/30" /></div>
        <div className="relative flex justify-center">
          <div className="px-6 bg-background">
            <div className="h-8 w-8 rounded-full border-2 border-primary/30 flex items-center justify-center">
              <Star className="h-4 w-4 text-primary/50" />
            </div>
          </div>
        </div>
      </div>

      {/* Why Us Section */}
      <section id="whyus" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">{t('Why Us', 'لماذا نحن')}</Badge>
              <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">{ct('whyus', 'title')}</h2>
              <p className="text-lg text-muted-foreground mb-8">{ct('whyus', 'subtitle')}</p>
              <div className="space-y-6">
                {(c.whyus?.reasons || []).map((reason: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{isAr ? (reason.title_ar || reason.title) : reason.title}</h3>
                      <p className="text-sm text-muted-foreground">{isAr ? (reason.desc_ar || reason.desc) : reason.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-primary/5" />
              <div className="relative p-8 rounded-2xl border border-border/50 bg-card space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex h-16 w-16 rounded-2xl bg-primary/10 items-center justify-center mx-auto">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold font-amiri text-foreground">{t('All-in-One Platform', 'منصة شاملة')}</h3>
                  <p className="text-sm text-muted-foreground">{t('Everything you need to run your Islamic educational institution', 'كل ما تحتاجه لإدارة مؤسستك التعليمية الإسلامية')}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: t('Courses', 'الدورات'), value: t('Unlimited', 'غير محدود') },
                    { label: t('Storage', 'التخزين'), value: '100GB' },
                    { label: t('Support', 'الدعم'), value: '24/7' },
                    { label: t('Updates', 'التحديثات'), value: t('Free', 'مجاني') },
                  ].map(stat => (
                    <div key={stat.label} className="text-center p-3 rounded-lg bg-muted/50">
                      <div className="text-lg font-bold text-foreground">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28 relative">
        <div className="absolute inset-0 bg-muted/30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">{t('Pricing', 'الأسعار')}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">{t('Simple, Transparent Pricing', 'أسعار بسيطة وشفافة')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">{t("Choose the plan that fits your institution's needs", 'اختر الخطة المناسبة لاحتياجات مؤسستك')}</p>
            <div className="inline-flex items-center gap-2 p-1 rounded-lg bg-muted border border-border">
              <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                {t('Monthly', 'شهري')}
              </button>
              <button onClick={() => setBillingCycle('yearly')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'yearly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                {t('Yearly', 'سنوي')} <Badge variant="secondary" className="ms-1 text-[10px]">{t('Save 20%', 'وفر 20%')}</Badge>
              </button>
            </div>
          </div>

          {filteredPackages.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPackages.map(pkg => (
                <Card key={pkg.id} className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${pkg.is_featured ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-border/50'}`}>
                  {pkg.is_featured && (
                    <div className="absolute top-0 end-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-es-lg">
                      {t('Popular', 'الأكثر طلباً')}
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-amiri">{isAr ? (pkg.title_ar || pkg.title) : pkg.title}</CardTitle>
                    <CardDescription>{isAr ? (pkg.subtitle_ar || pkg.subtitle) : pkg.subtitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      {pkg.sale_price != null ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-foreground">{currencySymbol}{pkg.sale_price}</span>
                          <span className="text-lg text-muted-foreground line-through">{currencySymbol}{pkg.regular_price}</span>
                          <span className="text-sm text-muted-foreground">/{billingCycle === 'monthly' ? t('mo', 'شهر') : t('yr', 'سنة')}</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-foreground">{currencySymbol}{pkg.regular_price}</span>
                          <span className="text-sm text-muted-foreground">/{billingCycle === 'monthly' ? t('mo', 'شهر') : t('yr', 'سنة')}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground">{t('Teachers', 'المعلمين')}</span>
                        <span className="font-medium text-foreground">{pkg.max_teachers}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground">{t('Students', 'الطلاب')}</span>
                        <span className="font-medium text-foreground">{pkg.max_students}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground">{t('Courses', 'الدورات')}</span>
                        <span className="font-medium text-foreground">{pkg.max_courses}</span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {(pkg.features || []).map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant={pkg.is_featured ? 'default' : 'outline'} onClick={() => navigate(user ? '/dashboard' : '/login')}>
                      {t('Get Started', 'ابدأ الآن')}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('Pricing packages coming soon. Contact us for custom quotes.', 'باقات الأسعار قريباً. تواصل معنا للحصول على عروض مخصصة.')}</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={islamicPatternHero} alt="" className="w-full h-full object-cover opacity-10 dark:opacity-5" />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">{ct('cta', 'title')}</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">{ct('cta', 'subtitle')}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" onClick={() => navigate(user ? '/dashboard' : '/login')} className="text-base">
              {t('Start Free Trial', 'ابدأ تجربة مجانية')} <ChevronRight className="h-5 w-5 ms-2" />
            </Button>
            <Button variant="outline" size="lg" className="text-base">
              {t('Contact Sales', 'تواصل مع المبيعات')}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                {appLogo ? (
                  <img src={appLogo} alt={appName} className="h-6 w-6 rounded object-cover" />
                ) : (
                  <BookOpen className="h-6 w-6 text-primary" />
                )}
                <span className="text-lg font-bold font-amiri text-foreground">{appName}</span>
              </div>
              <p className="text-sm text-muted-foreground">{t('Comprehensive Islamic education management platform.', 'منصة شاملة لإدارة التعليم الإسلامي.')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">{t('Product', 'المنتج')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => scrollTo('features')} className="hover:text-foreground transition-colors">{t('Features', 'المميزات')}</button></li>
                <li><button onClick={() => scrollTo('pricing')} className="hover:text-foreground transition-colors">{t('Pricing', 'الأسعار')}</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">{t('Company', 'الشركة')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => scrollTo('whyus')} className="hover:text-foreground transition-colors">{t('About Us', 'من نحن')}</button></li>
                <li><a href="#" className="hover:text-foreground transition-colors">{t('Contact', 'تواصل معنا')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">{t('Legal', 'قانوني')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">{t('Privacy Policy', 'سياسة الخصوصية')}</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">{t('Terms of Service', 'شروط الخدمة')}</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center">
            <CopyrightText />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
