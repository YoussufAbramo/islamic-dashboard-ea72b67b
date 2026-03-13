import { getField } from '@/lib/landingDefaults';
import { useCountUp } from '@/hooks/use-landing-animations';

interface StatsSectionProps {
  content: Record<string, any>;
  isAr: boolean;
}

const StatItem = ({ stat, isAr }: { stat: any; isAr: boolean }) => {
  const { display, ref } = useCountUp(stat.value, 2000);
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{display}</div>
      <div className="text-sm text-muted-foreground font-medium">{isAr ? (stat.label_ar || stat.label) : stat.label}</div>
    </div>
  );
};

const StatsSection = ({ content, isAr }: StatsSectionProps) => {
  const items = content?.items || [];
  if (items.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-primary/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {content?.title && (
          <h2 className="text-2xl md:text-3xl font-bold font-amiri text-foreground text-center mb-12">
            {getField(content, 'title', isAr)}
          </h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((stat: any, i: number) => (
            <StatItem key={i} stat={stat} isAr={isAr} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
