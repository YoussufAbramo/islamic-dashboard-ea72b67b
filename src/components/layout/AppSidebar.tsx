import { BookOpen, Users, GraduationCap, HeadphonesIcon, Calendar, CreditCard, MessageSquare, LayoutDashboard, Settings, ClipboardCheck, Award, BarChart3 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { APP_VERSION } from '@/lib/version';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from '@/components/ui/sidebar';

const AppSidebar = () => {
  const { role, profile } = useAuth();
  const { t, language } = useLanguage();
  const { appName, appLogo } = useAppSettings();
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
    { key: 'attendance', label: isAr ? 'الحضور' : 'Attendance', icon: ClipboardCheck, path: '/dashboard/attendance', roles: ['admin', 'teacher'] },
    { key: 'certificates', label: isAr ? 'الشهادات' : 'Certificates', icon: Award, path: '/dashboard/certificates', roles: ['admin', 'teacher', 'student'] },
    { key: 'reports', label: isAr ? 'التقارير' : 'Reports', icon: BarChart3, path: '/dashboard/reports', roles: ['admin'] },
    { key: 'chats', label: t('nav.chats'), icon: MessageSquare, path: '/dashboard/chats', roles: ['admin', 'teacher', 'student'] },
  ];

  const isAr = language === 'ar';
  const items = allItems.filter((item) => role && item.roles.includes(role));

  return (
    <Sidebar side={isAr ? 'right' : 'left'}>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          {appLogo ? (
            <img src={appLogo} alt="Logo" className="h-7 w-7 rounded object-cover" />
          ) : (
            <BookOpen className="h-6 w-6 text-gold" />
          )}
          <h2 className="text-lg font-bold font-amiri text-sidebar-foreground truncate">
            {appName || (isAr ? 'منصة التعليم' : 'EduDash')}
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
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-3 space-y-2">
          {/* Settings link */}
          <div
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors"
            onClick={() => navigate('/dashboard/settings')}
          >
            <Settings className="h-5 w-5 text-sidebar-foreground/60" />
            <span className="text-sm text-sidebar-foreground/80">{isAr ? 'الإعدادات' : 'Settings'}</span>
          </div>

          {/* User profile */}
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
          </div>

          <p className="text-[10px] text-sidebar-foreground/40 text-center">v{APP_VERSION}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
