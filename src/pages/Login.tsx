import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { GraduationCap, Users, ShieldCheck, Eye, EyeOff, BookOpen } from 'lucide-react';

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
    const { data, error } = await signIn(email, password);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    // Verify role matches
    const { data: roleData } = await (await import('@/integrations/supabase/client')).supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .single();

    if (roleData?.role !== selectedRole) {
      await (await import('@/integrations/supabase/client')).supabase.auth.signOut();
      toast.error(language === 'ar' ? 'نوع الحساب غير صحيح' : 'Account type does not match. Please select the correct role.');
      setLoading(false);
      return;
    }
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Islamic pattern background */}
      <div className="absolute inset-0 islamic-pattern opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background" />

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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <BookOpen className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl font-bold font-amiri text-gold">
            {language === 'ar' ? 'منصة التعليم' : 'EduDash'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-amiri">
            {language === 'ar' ? 'بسم الله الرحمن الرحيم' : 'In the Name of Allah, the Most Gracious'}
          </p>
        </div>

        <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/90">
          <CardHeader className="pb-4 text-center">
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
                          flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all duration-200
                          ${isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/30 hover:bg-muted/50'
                          }
                        `}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? config.color : 'text-muted-foreground'}`} />
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
                  className="h-11"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                    className="h-11 pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

        {/* Footer decoration */}
        <div className="text-center mt-6">
          <div className="inline-block w-24 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default Login;
