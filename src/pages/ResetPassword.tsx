import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import CopyrightText from '@/components/CopyrightText';
import { toast } from 'sonner';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import islamicBg from '@/assets/islamic-bg.jpg';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const { language } = useLanguage();
  const navigate = useNavigate();

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
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(language === 'ar' ? 'تم تحديث كلمة المرور بنجاح' : 'Password updated successfully');
      navigate('/login');
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{language === 'ar' ? 'رابط غير صالح' : 'Invalid reset link'}</p>
      </div>
    );
  }

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

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4 islamic-arch-glow">
            <BookOpen className="w-10 h-10 text-gold" />
          </div>
          <h1 className="text-2xl font-bold font-amiri text-gold">
            {language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
          </h1>
        </div>

        <Card className="border-border/30 shadow-2xl backdrop-blur-xl bg-card/80 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[hsl(var(--emerald))] via-[hsl(var(--gold))] to-[hsl(var(--emerald))]" />
          <CardHeader className="text-center">
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter your new password'}
            </p>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
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
                <Label htmlFor="confirm">{language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Label>
                <Input id="confirm" type="password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} required className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? '...' : language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}
              </Button>
            </CardContent>
          </form>
        </Card>

        <div className="text-center mt-6">
          <CopyrightText />
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;