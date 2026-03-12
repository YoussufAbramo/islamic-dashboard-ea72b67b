import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getField } from '@/lib/landingDefaults';
import { toast } from 'sonner';

interface NewsletterSectionProps {
  content: Record<string, any>;
  isAr: boolean;
}

const NewsletterSection = ({ content, isAr }: NewsletterSectionProps) => {
  const [email, setEmail] = useState('');
  const t = (en: string, ar: string) => isAr ? ar : en;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success(isAr ? 'تم الاشتراك بنجاح!' : 'Subscribed successfully!');
    setEmail('');
  };

  return (
    <section id="newsletter" className="py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-border/50 bg-muted/30 px-6 py-4">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-center sm:text-start">
            <h2 className="text-sm font-bold text-foreground">{getField(content, 'title', isAr)}</h2>
            <p className="text-xs text-muted-foreground">{getField(content, 'subtitle', isAr)}</p>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('Enter your email', 'أدخل بريدك الإلكتروني')}
              className="h-8 text-xs w-48"
              required
            />
            <Button type="submit" size="sm" className="h-8 text-xs px-4">
              {getField(content, 'button_text', isAr) || t('Subscribe', 'اشترك')}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
