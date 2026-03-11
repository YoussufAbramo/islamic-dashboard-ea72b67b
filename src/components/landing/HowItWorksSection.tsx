import { Badge } from '@/components/ui/badge';
import { getField } from '@/lib/landingDefaults';

interface HowItWorksSectionProps {
  content: Record<string, any>;
  isAr: boolean;
}

const HowItWorksSection = ({ content, isAr }: HowItWorksSectionProps) => {
  const steps = content?.steps || [];
  const t = (en: string, ar: string) => isAr ? ar : en;

  return (
    <section id="howitworks" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">{t('How It Works', 'كيف يعمل')}</Badge>
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">{getField(content, 'title', isAr)}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{getField(content, 'subtitle', isAr)}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step: any, i: number) => (
            <div key={i} className="text-center relative">
              <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-7 start-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-border" />
              )}
              <h3 className="font-bold text-foreground mb-2">{isAr ? (step.title_ar || step.title) : step.title}</h3>
              <p className="text-sm text-muted-foreground">{isAr ? (step.desc_ar || step.desc) : step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
