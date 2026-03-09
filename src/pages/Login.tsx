import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import CopyrightText from '@/components/CopyrightText';
import { toast } from 'sonner';
import { GraduationCap, Users, ShieldCheck, Eye, EyeOff, BookOpen } from 'lucide-react';
import islamicBg from '@/assets/islamic-bg.jpg';

type LoginRole = 'student' | 'teacher' | 'admin';

const roleConfig = {
  student: { icon: GraduationCap, color: 'text-emerald-600 dark:text-emerald-400' },
  teacher: { icon: Users, color: 'text-amber-600 dark:text-amber-400' },
  admin: { icon: ShieldCheck, color: 'text-rose-600 dark:text-rose-400' },
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<LoginRole | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      toast.error(language === 'ar' ? 'يرجى اختيار نوع الحساب' : 'Please select your account type');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    navigate('/dashboard');
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error(language === 'ar' ? 'يرجى إدخال بريدك الإلكتروني أولاً' : 'Please enter your email first');
      return;
    }
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(language === 'ar' ? 'تم إرسال رابط إعادة تعيين كلمة المرور' : 'Password reset link sent to your email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Islamic background image - fixed direction so it doesn't flip in RTL */}
      <div
        className="absolute inset-0 opacity-15 dark:opacity-10"
        style={{
          backgroundImage: `url(${islamicBg})`,
          backgroundSize: '400px 400px',
          backgroundRepeat: 'repeat',
          direction: 'ltr',
        }}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-background/90" />

      {/* Decorative corner ornaments */}
      <svg className="absolute top-0 left-0 w-32 h-32 text-gold/20" viewBox="0 0 100 100">
        <path d="M0 0 L50 0 A50 50 0 0 0 0 50 Z" fill="currentColor" />
        <path d="M10 10 L40 10 A30 30 0 0 0 10 40 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
      </svg>
      <svg className="absolute bottom-0 right-0 w-32 h-32 text-gold/20 rotate-180" viewBox="0 0 100 100">
        <path d="M0 0 L50 0 A50 50 0 0 0 0 50 Z" fill="currentColor" />
        <path d="M10 10 L40 10 A30 30 0 0 0 10 40 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
      </svg>

      {/* Language toggle */}
      <button
        onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
        className="absolute top-4 end-4 z-10 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border bg-card/80 backdrop-blur-sm"
      >
        {language === 'en' ? 'العربية' : 'English'}
      </button>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Header branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4 islamic-arch-glow">
            <BookOpen className="w-10 h-10 text-gold" />
          </div>
          <h1 className="text-4xl font-bold font-amiri text-gold">
            {language === 'ar' ? 'منصة التعليم' : 'EduDash'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-amiri">
            {language === 'ar' ? 'بسم الله الرحمن الرحيم' : 'In the Name of Allah, the Most Gracious'}
          </p>
          {/* Gold separator */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[hsl(var(--gold))]/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[hsl(var(--gold))]/60" />
          </div>
        </div>

        {/* Arch decoration */}
        <div className="relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-12 overflow-hidden">
            <div className="w-24 h-24 rounded-full border-2 border-[hsl(var(--gold))]/30" />
          </div>

          <Card className="border-border/30 shadow-2xl backdrop-blur-xl bg-card/80 overflow-hidden">
            {/* Decorative top border */}
            <div className="h-1 bg-gradient-to-r from-[hsl(var(--emerald))] via-[hsl(var(--gold))] to-[hsl(var(--emerald))]" />

            <CardHeader className="pb-4 text-center pt-8">
              <h2 className="text-xl font-semibold">{t('auth.login')}</h2>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'اختر نوع حسابك ثم سجل الدخول' : 'Select your account type to continue'}
              </p>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-5">
                {/* Role selector */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {language === 'ar' ? 'نوع الحساب' : 'Account Type'}
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['student', 'teacher', 'admin'] as const).map((r) => {
                      const config = roleConfig[r];
                      const Icon = config.icon;
                      const isSelected = selectedRole === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setSelectedRole(r)}
                          className={`
                            flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all duration-300 group
                            ${isSelected
                              ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                              : 'border-border hover:border-primary/30 hover:bg-muted/50 hover:shadow-sm'
                            }
                          `}
                        >
                          <Icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${isSelected ? config.color : 'text-muted-foreground'}`} />
                          <span className={`text-xs font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {t(`auth.${r}`)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                    className="h-11 focus:ring-[hsl(var(--gold))]/50 focus:border-[hsl(var(--gold))]"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-primary hover:underline transition-colors"
                    >
                      {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                      className="h-11 pe-10 focus:ring-[hsl(var(--gold))]/50 focus:border-[hsl(var(--gold))]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium"
                  disabled={loading || !selectedRole}
                >
                  {loading ? t('common.loading') : t('auth.login')}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  {t('auth.noAccount')}{' '}
                  <Link to="/signup" className="text-primary font-medium hover:underline">
                    {t('auth.signup')}
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-[hsl(var(--gold))]/40" />
            <div className="w-1 h-1 rounded-full bg-gold/40" />
            <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-[hsl(var(--gold))]/40" />
          </div>
          <CopyrightText />
        </div>
      </div>
    </div>
  );
};

export default Login;