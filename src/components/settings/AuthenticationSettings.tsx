import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AuthenticationSettings = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || '';

  const providers = [
    {
      id: 'google',
      name: 'Google',
      icon: '🔵',
      description: isAr ? 'تسجيل الدخول باستخدام حساب Google' : 'Sign in with Google account',
      docsUrl: 'https://supabase.com/docs/guides/auth/social-login/auth-google',
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: '⚫',
      description: isAr ? 'تسجيل الدخول باستخدام حساب GitHub' : 'Sign in with GitHub account',
      docsUrl: 'https://supabase.com/docs/guides/auth/social-login/auth-github',
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: '🍎',
      description: isAr ? 'تسجيل الدخول باستخدام حساب Apple' : 'Sign in with Apple account',
      docsUrl: 'https://supabase.com/docs/guides/auth/social-login/auth-apple',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {isAr ? 'مزودي المصادقة' : 'Authentication Providers'}
          </CardTitle>
          <CardDescription>
            {isAr
              ? 'قم بإعداد مزودي تسجيل الدخول الخارجيين من لوحة تحكم Supabase'
              : 'Configure external login providers from your Supabase dashboard'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {providers.map((provider) => (
            <div key={provider.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{provider.icon}</span>
                <div>
                  <p className="font-medium text-sm">{provider.name}</p>
                  <p className="text-xs text-muted-foreground">{provider.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {isAr ? 'إعداد خارجي' : 'External Setup'}
                </Badge>
                <Button variant="ghost" size="sm" asChild>
                  <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          ))}

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              {isAr
                ? 'لإعداد مزودي المصادقة، انتقل إلى لوحة تحكم Supabase → Authentication → Providers. اتبع التعليمات لكل مزود لإضافة بيانات OAuth المطلوبة.'
                : 'To configure authentication providers, go to your Supabase Dashboard → Authentication → Providers. Follow the instructions for each provider to add the required OAuth credentials.'}
            </p>
            {supabaseProjectId && (
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <a
                  href={`https://supabase.com/dashboard/project/${supabaseProjectId}/auth/providers`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 me-1" />
                  {isAr ? 'فتح لوحة تحكم Supabase' : 'Open Supabase Dashboard'}
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthenticationSettings;
