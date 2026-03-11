import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Sparkles } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

interface ComingSoonOverlayProps {
  icon?: LucideIcon;
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  children: React.ReactNode;
}

const ComingSoonOverlay = ({
  icon: Icon = Sparkles,
  title = 'Coming Soon',
  titleAr = 'قريباً',
  description = 'This feature is currently under development and will be available soon.',
  descriptionAr = 'هذه الميزة قيد التطوير حالياً وستكون متاحة قريباً.',
  children,
}: ComingSoonOverlayProps) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="relative">
      {!dismissed && (
        <div className="absolute inset-0 z-20 bg-background/70 backdrop-blur-[2px] flex items-center justify-center rounded-xl pointer-events-auto">
          <div className="text-center space-y-3 p-6">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Icon className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{isAr ? titleAr : title}</h2>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
                {isAr ? descriptionAr : description}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {isAr ? 'قيد التطوير' : 'In Development'}
            </Badge>
            <div>
              <Button variant="outline" size="sm" className="gap-1.5 mt-1" onClick={() => setDismissed(true)}>
                <Eye className="h-3.5 w-3.5" />
                {isAr ? 'عرض فقط' : 'View Only'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className={dismissed ? 'pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  );
};

export default ComingSoonOverlay;
