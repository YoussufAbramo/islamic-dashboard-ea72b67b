import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getField } from '@/lib/landingDefaults';

interface CTASectionProps {
  content: Record<string, any>;
  isAr: boolean;
}

const CTASection = ({ content, isAr }: CTASectionProps) => {
  const navigate = useNavigate();
  const t = (en: string, ar: string) => isAr ? ar : en;

  return (
    <section className="py-20 md:py-28 bg-primary/5">
      <div className="mx-auto max-w-3xl px-4 text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground">{getField(content, 'title', isAr)}</h2>
        <p className="text-muted-foreground text-lg">{getField(content, 'subtitle', isAr)}</p>
        <Button size="lg" onClick={() => navigate('/login')} className="text-base">
          {t('Start Free Trial', 'ابدأ التجربة المجانية')} <ChevronRight className="h-5 w-5 ms-2 rtl:-scale-x-100" />
        </Button>
      </div>
    </section>
  );
};

export default CTASection;
