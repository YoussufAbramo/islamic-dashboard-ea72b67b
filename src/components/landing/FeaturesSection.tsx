import { BookOpen, Users, GraduationCap, Calendar, Award, BarChart3, MessageSquare, Shield, Sparkles, Layers, Star, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getField } from '@/lib/landingDefaults';

const iconMap: Record<string, any> = {
  BookOpen, Users, GraduationCap, Calendar, Award, BarChart3, MessageSquare, Shield, Sparkles, Layers, Star, HelpCircle,
};

interface FeaturesSectionProps {
  content: Record<string, any>;
  isAr: boolean;
}

const FeaturesSection = ({ content, isAr }: FeaturesSectionProps) => {
  const items = content?.items || [];
  const t = (en: string, ar: string) => isAr ? ar : en;

  return (
    <section id="features" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">{t('Features', 'المميزات')}</Badge>
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">{getField(content, 'title', isAr)}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{getField(content, 'subtitle', isAr)}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((feature: any, i: number) => {
            const Icon = iconMap[feature.icon] || BookOpen;
            return (
              <Card key={i} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{isAr ? (feature.title_ar || feature.title) : feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{isAr ? (feature.desc_ar || feature.desc) : feature.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
