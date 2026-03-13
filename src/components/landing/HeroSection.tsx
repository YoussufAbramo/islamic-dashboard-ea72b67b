import { useNavigate } from 'react-router-dom';
import { Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getField } from '@/lib/landingDefaults';
const islamicPatternHero = '/system/backgrounds/islamic-pattern-hero.jpg';
const dashboardMockup = '/system/samples/dashboard-mockup.png';

interface HeroSectionProps {
  content: Record<string, any>;
  isAr: boolean;
  user: any;
  statsContent?: Record<string, any>;
}

const HeroSection = ({ content, isAr, user, statsContent }: HeroSectionProps) => {
  const navigate = useNavigate();
  const t = (en: string, ar: string) => isAr ? ar : en;
  const heroStats = statsContent?.items?.slice(0, 3) || [
    { value: '500+', label: 'Institutions', label_ar: 'مؤسسة' },
    { value: '10k+', label: 'Students', label_ar: 'طالب' },
    { value: '99.9%', label: 'Uptime', label_ar: 'وقت التشغيل' },
  ];

  return (
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
              {getField(content, 'title', isAr)}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              {getField(content, 'subtitle', isAr)}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={() => navigate(user ? '/dashboard' : '/login')} className="text-base">
                {getField(content, 'cta', isAr)} <ChevronRight className="h-5 w-5 ms-2 rtl:-scale-x-100" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-base">
                {t('Learn More', 'اعرف المزيد')}
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-4">
              {heroStats.map((stat: any, i: number) => (
                <div key={i} className="flex items-center gap-6">
                  {i > 0 && <div className="h-8 w-px bg-border" />}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{isAr ? stat.label_ar : stat.label}</div>
                  </div>
                </div>
              ))}
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
  );
};

export default HeroSection;
