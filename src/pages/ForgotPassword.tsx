import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import CopyrightText from '@/components/CopyrightText';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BookOpen, Moon, Sun, ArrowLeft, Mail } from 'lucide-react';
import islamicBg from '@/assets/islamic-bg.jpg';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const isAr = language === 'ar';

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error(isAr ? 'يرجى إدخال بريدك الإلكتروني' : 'Please enter your email'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success(isAr ? 'تم إرسال رابط إعادة تعيين كلمة المرور' : 'Password reset link sent to your email');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-15 dark:opacity-10" style={{ backgroundImage: `url(${islamicBg})`, backgroundSize: '400px', backgroundRepeat: 'repeat', direction: 'ltr' }} />
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-background/90" />

      <div className="absolute top-4 end-4 z-10 flex items-center gap-2">
        <button onClick={toggleDark} className="p-2 rounded-full border border-border bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors">
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="text-sm font-medium px-3 py-1.5 rounded-full border border-border bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors">
          {language === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{isAr ? 'نسيت كلمة المرور' : 'Forgot Password'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين' : 'Enter your email to receive a reset link'}
          </p>
        </div>

        <Card className="border-border/30 shadow-2xl backdrop-blur-xl bg-card/80">
          <div className="h-1 bg-gradient-to-r from-primary via-[hsl(var(--gold))] to-primary" />
          {sent ? (
            <CardContent className="pt-8 pb-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{isAr ? 'تم الإرسال!' : 'Email Sent!'}</h3>
              <p className="text-sm text-muted-foreground">{isAr ? 'تفقد بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور' : 'Check your email for a password reset link'}</p>
              <Link to="/login">
                <Button variant="outline" className="mt-2">
                  <ArrowLeft className="h-4 w-4 me-1" />{isAr ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                </Button>
              </Link>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={isAr ? 'أدخل بريدك الإلكتروني' : 'Enter your email'} className="h-11" />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? (isAr ? 'جارٍ الإرسال...' : 'Sending...') : (isAr ? 'إرسال رابط إعادة التعيين' : 'Send Reset Link')}
                </Button>
                <Link to="/login" className="text-sm text-primary hover:underline flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />{isAr ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>

        <div className="text-center mt-4">
          <CopyrightText />
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
