import { BookOpen, Users, GraduationCap, HeadphonesIcon, Calendar, CreditCard, MessageSquare, LayoutDashboard, Settings, Sun, Moon, Monitor, ChevronDown, ClipboardCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useTheme } from 'next-themes';
import { APP_VERSION } from '@/lib/version';
import CopyrightText from '@/components/CopyrightText';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from '@/components/ui/sidebar';

const AppSidebar = () => {
  const { role, profile, signOut } = useAuth();
  const { t, language } = useLanguage();
  const { currency, setCurrency, currencies } = useAppSettings();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const allItems = [
    { key: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'teacher', 'student'] },
    { key: 'courses', label: t('nav.courses'), icon: BookOpen, path: '/dashboard/courses', roles: ['admin', 'teacher', 'student'] },
    { key: 'students', label: t('nav.students'), icon: GraduationCap, path: '/dashboard/students', roles: ['admin', 'teacher'] },
    { key: 'teachers', label: t('nav.teachers'), icon: Users, path: '/dashboard/teachers', roles: ['admin'] },
    { key: 'support', label: t('nav.support'), icon: HeadphonesIcon, path: '/dashboard/support', roles: ['admin'] },
    { key: 'timetable', label: t('nav.timetable'), icon: Calendar, path: '/dashboard/timetable', roles: ['admin', 'teacher', 'student'] },
    { key: 'subscriptions', label: t('nav.subscriptions'), icon: CreditCard, path: '/dashboard/subscriptions', roles: ['admin'] },
    { key: 'attendance', label: language === 'ar' ? 'الحضور' : 'Attendance', icon: ClipboardCheck, path: '/dashboard/attendance', roles: ['admin', 'teacher'] },
    { key: 'chats', label: t('nav.chats'), icon: MessageSquare, path: '/dashboard/chats', roles: ['admin', 'teacher', 'student'] },
  ];

  const items = allItems.filter((item) => role && item.roles.includes(role));

  const themeOptions = [
    { value: 'light', label: language === 'ar' ? 'فاتح' : 'Light', icon: Sun },
    { value: 'dark', label: language === 'ar' ? 'داكن' : 'Dark', icon: Moon },
    { value: 'system', label: language === 'ar' ? 'النظام' : 'System', icon: Monitor },
  ];

  return (
    <Sidebar side={language === 'ar' ? 'right' : 'left'}>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-gold" />
          <h2 className="text-lg font-bold font-amiri text-sidebar-foreground">
            {language === 'ar' ? 'منصة التعليم' : 'EduDash'}
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.dashboard')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* App Settings */}
        <SidebarGroup>
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider hover:text-sidebar-foreground transition-colors">
              <span className="flex items-center gap-2">
                <Settings className="h-3.5 w-3.5" />
                {language === 'ar' ? 'إعدادات التطبيق' : 'App Settings'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform [[data-state=open]>&]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 pb-3 space-y-3">
                {/* Theme */}
                <div className="space-y-1.5">
                  <p className="text-[11px] text-sidebar-foreground/60 font-medium">
                    {language === 'ar' ? 'المظهر' : 'Theme'}
                  </p>
                  <div className="flex gap-1">
                    {themeOptions.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setTheme(opt.value)}
                          className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-md text-[10px] transition-colors ${
                            theme === opt.value
                              ? 'bg-primary/15 text-primary'
                              : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <p className="text-[11px] text-sidebar-foreground/60 font-medium">
                    {language === 'ar' ? 'العملة' : 'Currency'}
                  </p>
                  <Select
                    value={currency.name}
                    onValueChange={(v) => {
                      const c = currencies.find((c) => c.name === v);
                      if (c) setCurrency(c);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs bg-sidebar-accent/50 border-sidebar-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.name} value={c.name}>
                          {c.symbol} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {/* User profile section */}
        <div className="p-3 space-y-3">
          <div
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors"
            onClick={() => navigate('/dashboard/profile')}
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-[11px] text-sidebar-foreground/60 truncate">{role || ''}</p>
            </div>
            <Settings className="h-4 w-4 text-sidebar-foreground/40" />
          </div>

          <div className="text-center space-y-1">
            <CopyrightText
              className="text-[10px] text-sidebar-foreground/50"
              linkClassName="underline hover:text-sidebar-foreground transition-colors"
            />
            <p className="text-[10px] text-sidebar-foreground/40">v{APP_VERSION}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
