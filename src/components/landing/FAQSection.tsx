import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getField } from '@/lib/landingDefaults';

interface FAQSectionProps {
  content: Record<string, any>;
  isAr: boolean;
}

const FAQSection = ({ content, isAr }: FAQSectionProps) => {
  const items = content?.items || [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const t = (en: string, ar: string) => isAr ? ar : en;
  if (items.length === 0) return null;

  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 bg-muted/30 rounded-3xl p-8 md:p-12 border border-border/50">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">{t('FAQ', 'الأسئلة الشائعة')}</Badge>
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">{getField(content, 'title', isAr)}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{getField(content, 'subtitle', isAr)}</p>
        </div>
        <div className="space-y-3">
          {items.map((item: any, i: number) => (
            <div key={i} className="rounded-xl border border-border/50 bg-background overflow-hidden transition-shadow duration-300 hover:shadow-sm">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-start"
              >
                <span className="font-medium text-foreground">{isAr ? (item.question_ar || item.question) : item.question}</span>
                <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: openIndex === i ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {isAr ? (item.answer_ar || item.answer) : item.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
