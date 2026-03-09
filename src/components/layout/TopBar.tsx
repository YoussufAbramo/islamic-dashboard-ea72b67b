import { Moon, Sun, Bell, Megaphone, Globe, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const TopBar = () => {
  const { user, profile, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [notifications, setNotifications] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      supabase.from('notifications').select('*').eq('user_id', user.id).eq('is_read', false).order('created_at', { ascending: false }).limit(5).then(({ data }) => setNotifications(data || []));
      supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(5).then(({ data }) => setAnnouncements(data || []));
    }
  }, [user]);

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger />
      <div className="flex-1" />

      {/* Language toggle */}
      <Button variant="ghost" size="icon" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>
        <Globe className="h-4 w-4" />
      </Button>

      {/* Dark mode toggle */}
      <Button variant="ghost" size="icon" onClick={toggleDark}>
        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {/* Announcements */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Megaphone className="h-4 w-4" />
            {announcements.length > 0 && <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">{announcements.length}</Badge>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          {announcements.length === 0 ? (
            <DropdownMenuItem disabled>{t('common.noData')}</DropdownMenuItem>
          ) : announcements.map((a) => (
            <DropdownMenuItem key={a.id} className="flex flex-col items-start">
              <span className="font-medium text-sm">{language === 'ar' && a.title_ar ? a.title_ar : a.title}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">{language === 'ar' && a.content_ar ? a.content_ar : a.content}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">{notifications.length}</Badge>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          {notifications.length === 0 ? (
            <DropdownMenuItem disabled>{t('common.noData')}</DropdownMenuItem>
          ) : notifications.map((n) => (
            <DropdownMenuItem key={n.id} className="flex flex-col items-start">
              <span className="font-medium text-sm">{n.title}</span>
              <span className="text-xs text-muted-foreground">{n.message}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <User className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="font-medium">{profile?.full_name || user?.email}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
            <User className="h-4 w-4 me-2" /> {t('nav.profile')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="h-4 w-4 me-2" /> {t('auth.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default TopBar;
