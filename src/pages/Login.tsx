import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import CopyrightText from '@/components/CopyrightText';
import { toast } from 'sonner';
import { GraduationCap, Users, ShieldCheck, Eye, EyeOff, BookOpen, Moon, Sun, Mail, ExternalLink } from 'lucide-react';
import islamicBg from '@/assets/islamic-bg.jpg';

type LoginRole = 'student' | 'teacher' | 'admin';

const roleConfig = {
  student: { icon: GraduationCap, color: 'text-emerald-600 dark:text-emerald-400' },
  teacher: { icon: Users, color: 'text-amber-600 dark:text-amber-400' },
  admin: { icon: ShieldCheck, color: 'text-rose-600 dark:text-rose-400' },
};


const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const IslamicCorner = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 120" fill="none">
    <path d="M0 0h60v60H0z" fill="currentColor" opacity="0.08"/>
    <path d="M30 5L35 15L45 10L40 20L50 25L40 30L45 40L35 35L30 45L25 35L15 40L20 30L10 25L20 20L15 10L25 15Z" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
    <circle cx="30" cy="25" r="8" stroke="currentColor" strokeWidth="0.3" opacity="0.15"/>
    <circle cx="30" cy="25" r="15" stroke="currentColor" strokeWidth="0.3" opacity="0.1"/>
    <path d="M5 5L55 5L55 55L5 55Z" stroke="currentColor" strokeWidth="0.3" opacity="0.08"/>
    <path d="M15 5L15 55M25 5L25 55M35 5L35 55M45 5L45 55" stroke="currentColor" strokeWidth="0.15" opacity="0.06"/>
    <path d="M5 15L55 15M5 25L55 25M5 35L55 35M5 45L55 45" stroke="currentColor" strokeWidth="0.15" opacity="0.06"/>
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<LoginRole | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { appName, appDescription, appLogo } = useAppSettings();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

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


  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      <div
        className="absolute inset-0 opacity-15 dark:opacity-10"
        style={{
          backgroundImage: `url(${islamicBg})`,
          backgroundSize: '400px 400px',
          backgroundRepeat: 'repeat',
          direction: 'ltr',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-background/90" />

      <IslamicCorner className="absolute top-0 left-0 w-28 h-28 text-gold/30" />
      <IslamicCorner className="absolute bottom-0 right-0 w-28 h-28 text-gold/30 rotate-180" />
      <IslamicCorner className="absolute top-0 right-0 w-20 h-20 text-gold/20 -scale-x-100" />
      <IslamicCorner className="absolute bottom-0 left-0 w-20 h-20 text-gold/20 scale-x-100 rotate-180 -scale-x-100" />

      {/* Top controls */}
      <div className="absolute top-4 end-4 z-10 flex items-center gap-2">
        <button
          onClick={toggleDark}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full border border-border bg-card/80 backdrop-blur-sm"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full border border-border bg-card/80 backdrop-blur-sm"
        >
          {language === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Header branding */}
        <div className="text-center mb-6">
          {appLogo ? (
            <img src={appLogo} alt="Logo" className="w-20 h-20 mx-auto mb-4 rounded-full object-cover border-2 border-primary/20" />
          ) : (
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4 islamic-arch-glow">
              <BookOpen className="w-10 h-10 text-gold" />
            </div>
          )}
          <h1 className="text-4xl font-bold font-amiri text-gold">
            {language === 'ar' ? (appName || 'منصة التعليم') : (appName || 'Islamic Dashboard')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-amiri">
            {appDescription || (language === 'ar' ? 'بسم الله الرحمن الرحيم' : 'In the Name of Allah, the Most Gracious')}
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[hsl(var(--gold))]/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[hsl(var(--gold))]/60" />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-12 overflow-hidden">
            <div className="w-24 h-24 rounded-full border-2 border-[hsl(var(--gold))]/30" />
          </div>

          <Card className="border-border/30 shadow-2xl backdrop-blur-xl bg-card/80 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[hsl(var(--emerald))] via-[hsl(var(--gold))] to-[hsl(var(--emerald))]" />

            <CardHeader className="pb-4 text-center pt-5">
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
                    className="h-11"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-primary hover:underline transition-colors"
                    >
                      {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                    </Link>
                  </div>
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

        {/* Contact Developer Section */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <a href="https://wa.me/201558612808" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card/80 backdrop-blur-sm text-xs text-muted-foreground hover:text-foreground transition-colors">
            <WhatsAppIcon /> WhatsApp
          </a>
          <a href="mailto:contact@codecom.dev" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card/80 backdrop-blur-sm text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Mail className="h-3.5 w-3.5" /> Email
          </a>
          <a href="https://codecom.dev/request-estimate/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card/80 backdrop-blur-sm text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ExternalLink className="h-3.5 w-3.5" /> {language === 'ar' ? 'طلب تقدير' : 'Get Estimate'}
          </a>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 space-y-2">
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
