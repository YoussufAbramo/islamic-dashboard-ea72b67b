import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getField } from '@/lib/landingDefaults';

interface PricingSectionProps {
  content: Record<string, any>;
  isAr: boolean;
  packages: any[];
  currencySymbol: string;
}

const PricingSection = ({ content, isAr, packages, currencySymbol }: PricingSectionProps) => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const t = (en: string, ar: string) => isAr ? ar : en;
  const filtered = packages.filter(p => p.billing_cycle === billingCycle);

  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">{t('Pricing', 'الأسعار')}</Badge>
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">{getField(content, 'title', isAr)}</h2>
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted mt-4">
            <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>
              {t('Monthly', 'شهري')}
            </button>
            <button onClick={() => setBillingCycle('yearly')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'yearly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>
              {t('Yearly', 'سنوي')}
            </button>
          </div>
        </div>
        <div className={`grid gap-6 max-w-5xl mx-auto ${filtered.length <= 3 ? `sm:grid-cols-${Math.min(filtered.length, 3)}` : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {filtered.map((pkg) => (
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
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-12">{t('No packages available for this billing cycle', 'لا توجد باقات متاحة لهذه الدورة المالية')}</div>
        )}
      </div>
    </section>
  );
};

export default PricingSection;
