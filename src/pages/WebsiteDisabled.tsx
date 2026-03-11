import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Globe, LogIn, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const WebsiteDisabled = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { pending } = useAppSettings();
  const isAr = language === 'ar';
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  const appName = pending.appName || 'Platform';
  const appLogo = pending.appLogo;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          {appLogo ? (
            <img src={appLogo} alt={appName} className="h-8 max-w-[140px] object-contain" />
          ) : (
            <span className="font-bold text-foreground">{appName}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDark}
            className="h-9 w-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="h-9 w-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <span className="text-sm font-bold leading-none" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>ع</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-muted flex items-center justify-center">
            <Globe className="h-10 w-10 text-muted-foreground" />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-amiri">
              {isAr ? 'الموقع غير متاح حالياً' : 'Website Unavailable'}
            </h1>
            <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
              {isAr
                ? 'قام مالك الموقع بتعطيل الصفحات العامة. يرجى التواصل مع مالك الموقع للمزيد من المعلومات، أو قم بتسجيل الدخول إلى لوحة التحكم إذا كان لديك صلاحية.'
                : 'The website owner has disabled the public pages. Please contact the website owner for more information, or log in to your dashboard if you have access.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button onClick={() => navigate('/login')} className="gap-2 min-w-[160px]">
              <LogIn className="h-4 w-4" />
              {isAr ? 'تسجيل الدخول' : 'Log In'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/60">
            {isAr ? 'إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع مسؤول النظام.' : 'If you believe this is an error, please contact the system administrator.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebsiteDisabled;
