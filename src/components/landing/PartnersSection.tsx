import { Building2 } from 'lucide-react';
import { getField } from '@/lib/landingDefaults';

interface PartnersSectionProps {
  content: Record<string, any>;
  isAr: boolean;
}

const PartnersSection = ({ content, isAr }: PartnersSectionProps) => {
  const items = content?.items || [];
  if (items.length === 0) return null;

  return (
    <section className="py-12 md:py-16 border-b border-border/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-muted-foreground mb-8 font-medium uppercase tracking-wider">
          {getField(content, 'title', isAr)}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {items.map((partner: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              {partner.logo_url ? (
                <img src={partner.logo_url} alt={isAr ? partner.name_ar : partner.name} className="h-10 max-w-[120px] object-contain grayscale hover:grayscale-0 transition-all" />
              ) : (
                <div className="flex items-center gap-2 px-4 py-2">
                  <Building2 className="h-5 w-5" />
                  <span className="text-sm font-medium">{isAr ? (partner.name_ar || partner.name) : partner.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
