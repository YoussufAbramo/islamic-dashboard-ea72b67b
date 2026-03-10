import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import CopyrightText from '@/components/CopyrightText';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BookOpen, Moon, Sun, ArrowLeft, Mail, Eye, EyeOff } from 'lucide-react';
import islamicBg from '@/assets/islamic-bg.jpg';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const { pending } = useAppSettings();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const isAr = language === 'ar';

  const appName = pending.appName || 'Islamic Dashboard';
  const appLogo = pending.appLogo;

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  // Detect recovery mode from URL hash or auth event
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error(isAr ? 'يرجى إدخال بريدك الإلكتروني' : 'Please enter your email'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/forgot-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success(isAr ? 'تم إرسال رابط إعادة تعيين كلمة المرور' : 'Password reset link sent to your email');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(isAr ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isAr ? 'تم تحديث كلمة المرور بنجاح' : 'Password updated successfully');
      navigate('/login');
    }
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
            {appLogo ? (
              <img src={appLogo} alt={appName} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <Mail className="w-8 h-8 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-bold">
            {isRecovery
              ? (isAr ? 'إعادة تعيين كلمة المرور' : 'Reset Password')
              : (isAr ? 'نسيت كلمة المرور' : 'Forgot Password')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRecovery
              ? (isAr ? 'أدخل كلمة المرور الجديدة' : 'Enter your new password')
              : (isAr ? 'أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين' : 'Enter your email to receive a reset link')}
          </p>
        </div>

        <Card className="border-border/30 shadow-2xl backdrop-blur-xl bg-card/80">
          <div className="h-1 bg-gradient-to-r from-primary via-[hsl(var(--gold))] to-primary" />

          {isRecovery ? (
            /* Reset password form */
            <form onSubmit={handleUpdatePassword}>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={password}
                      onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-11 pe-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">{isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Label>
                  <Input id="confirm" type="password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} required className="h-11" />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? '...' : isAr ? 'تحديث كلمة المرور' : 'Update Password'}
                </Button>
                <Link to="/login" className="text-sm text-primary hover:underline flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />{isAr ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                </Link>
              </CardFooter>
            </form>
          ) : sent ? (
            /* Email sent confirmation */
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
            /* Send reset email form */
            <form onSubmit={handleSendReset}>
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
