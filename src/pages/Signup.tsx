import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { GraduationCap, Users, ShieldCheck } from 'lucide-react';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, fullName, phone, role);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created! Please check your email to verify.');
      navigate('/login');
    }
  };

  const roleIcons = { student: GraduationCap, teacher: Users, admin: ShieldCheck };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('auth.signup')}</CardTitle>
          <CardDescription>EduDash - Educational Dashboard</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('auth.fullName')}</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('auth.phone')}</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>{t('auth.role')}</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['student', 'teacher', 'admin'] as const).map((r) => {
                  const Icon = roleIcons[r];
                  return (
                    <Button
                      key={r}
                      type="button"
                      variant={role === r ? 'default' : 'outline'}
                      className="flex flex-col gap-1 h-auto py-3"
                      onClick={() => setRole(r)}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs">{t(`auth.${r}`)}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.loading') : t('auth.signup')}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-primary underline">{t('auth.login')}</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Signup;
