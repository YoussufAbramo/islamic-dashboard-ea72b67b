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
    <section id="newsletter" className="py-16 md:py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Mail className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold font-amiri text-foreground mb-3">{getField(content, 'title', isAr)}</h2>
        <p className="text-muted-foreground mb-8">{getField(content, 'subtitle', isAr)}</p>
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('Enter your email', 'أدخل بريدك الإلكتروني')}
            className="flex-1"
            required
          />
          <Button type="submit">
            {getField(content, 'button_text', isAr) || t('Subscribe', 'اشترك')}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default NewsletterSection;
