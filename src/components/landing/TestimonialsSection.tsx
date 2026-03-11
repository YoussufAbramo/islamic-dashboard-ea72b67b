import { Star, Quote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getField } from '@/lib/landingDefaults';

interface TestimonialsSectionProps {
  content: Record<string, any>;
  isAr: boolean;
}

const TestimonialsSection = ({ content, isAr }: TestimonialsSectionProps) => {
  const items = content?.items || [];
  const t = (en: string, ar: string) => isAr ? ar : en;
  if (items.length === 0) return null;

  return (
    <section id="testimonials" className="py-20 md:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">{t('Testimonials', 'آراء العملاء')}</Badge>
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">{getField(content, 'title', isAr)}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{getField(content, 'subtitle', isAr)}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {items.map((item: any, i: number) => (
            <Card key={i} className="border-border/50">
              <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-foreground mb-6 leading-relaxed">{isAr ? (item.text_ar || item.text) : item.text}</p>
                {item.rating && (
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: item.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={item.photo_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {(isAr ? item.name_ar : item.name)?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-foreground text-sm">{isAr ? (item.name_ar || item.name) : item.name}</div>
                    <div className="text-xs text-muted-foreground">{isAr ? (item.role_ar || item.role) : item.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
