import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { GraduationCap, Users, Eye, EyeOff, BookOpen } from 'lucide-react';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName, phone, role);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(language === 'ar' ? 'تم إنشاء الحساب! يرجى التحقق من بريدك الإلكتروني' : 'Account created! Please check your email to verify.');
      navigate('/login');
    }
  };

  const roleConfig = {
    student: { icon: GraduationCap, label: t('auth.student'), desc: language === 'ar' ? 'التسجيل كطالب' : 'Register as a student' },
    teacher: { icon: Users, label: t('auth.teacher'), desc: language === 'ar' ? 'التسجيل كمعلم' : 'Register as a teacher' },
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      <div className="absolute inset-0 islamic-pattern opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background" />

      <button
        onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
        className="absolute top-4 end-4 z-10 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border bg-card/80 backdrop-blur-sm"
      >
        {language === 'en' ? 'العربية' : 'English'}
      </button>

      <div className="relative z-10 w-full max-w-md px-4 py-8">
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
            <h2 className="text-xl font-semibold">{t('auth.signup')}</h2>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'أنشئ حسابك للبدء' : 'Create your account to get started'}
            </p>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Role selector - only student and teacher */}
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'نوع الحساب' : 'Account Type'}</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(['student', 'teacher'] as const).map((r) => {
                    const config = roleConfig[r];
                    const Icon = config.icon;
                    const isSelected = role === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`
                          flex flex-col items-center gap-1.5 p-4 rounded-lg border-2 transition-all duration-200
                          ${isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/30 hover:bg-muted/50'
                          }
                        `}
                      >
                        <Icon className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {config.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{config.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-11"
                  placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11"
                  placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('auth.phone')}</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11"
                  placeholder={language === 'ar' ? 'أدخل رقم هاتفك' : 'Enter your phone number'} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-11 pe-10"
                    placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Min 6 characters'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} required className="h-11"
                  placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور' : 'Confirm your password'} />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                {loading ? t('common.loading') : t('auth.signup')}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                {t('auth.hasAccount')}{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">{t('auth.login')}</Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center mt-6">
          <div className="inline-block w-24 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default Signup;
