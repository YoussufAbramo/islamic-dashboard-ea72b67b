import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getField } from '@/lib/landingDefaults';

interface WhyUsSectionProps {
  content: Record<string, any>;
  isAr: boolean;
}

const WhyUsSection = ({ content, isAr }: WhyUsSectionProps) => {
  const reasons = content?.reasons || [];
  const t = (en: string, ar: string) => isAr ? ar : en;

  return (
    <section id="whyus" className="py-20 md:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">{t('Why Us', 'لماذا نحن')}</Badge>
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">{getField(content, 'title', isAr)}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{getField(content, 'subtitle', isAr)}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {reasons.map((reason: any, i: number) => (
            <div key={i} className="flex gap-4 p-6 rounded-xl bg-background border border-border/50">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">{isAr ? (reason.title_ar || reason.title) : reason.title}</h3>
                <p className="text-sm text-muted-foreground">{isAr ? (reason.desc_ar || reason.desc) : reason.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
