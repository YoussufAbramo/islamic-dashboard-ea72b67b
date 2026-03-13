import { Badge } from '@/components/ui/badge';
import { getField } from '@/lib/landingDefaults';
import { useInView } from '@/hooks/use-landing-animations';

interface HowItWorksSectionProps {
  content: Record<string, any>;
  isAr: boolean;
}

const HowItWorksSection = ({ content, isAr }: HowItWorksSectionProps) => {
  const steps = content?.steps || [];
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { ref, isInView } = useInView(0.3);

  return (
    <section id="howitworks" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">{t('How It Works', 'كيف يعمل')}</Badge>
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">{getField(content, 'title', isAr)}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{getField(content, 'subtitle', isAr)}</p>
        </div>
        <div ref={ref} className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
          {steps.map((step: any, i: number) => (
            <div
              key={i}
              className="text-center relative"
              style={{
                opacity: isInView ? 1 : 0,
                transform: isInView ? 'translateY(0)' : 'translateY(30px)',
                transition: `opacity 0.6s ease-out ${i * 0.3}s, transform 0.6s ease-out ${i * 0.3}s`,
              }}
            >
              <div className="relative z-10">
                <div
                  className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4"
                  style={{
                    transform: isInView ? 'scale(1)' : 'scale(0)',
                    transition: `transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.3 + 0.1}s`,
                  }}
                >
                  {i + 1}
                </div>
              </div>
              {/* Connecting path line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-7 start-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5 overflow-hidden">
                  <div
                    className="h-full bg-primary/40"
                    style={{
                      transform: isInView ? 'scaleX(1)' : 'scaleX(0)',
                      transformOrigin: isAr ? 'right' : 'left',
                      transition: `transform 0.8s ease-out ${i * 0.3 + 0.4}s`,
                    }}
                  />
                </div>
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
