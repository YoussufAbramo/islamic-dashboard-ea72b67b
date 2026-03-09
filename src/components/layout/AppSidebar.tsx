import { BookOpen, Users, GraduationCap, HeadphonesIcon, Calendar, CreditCard, MessageSquare, LayoutDashboard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_VERSION } from '@/lib/version';
import CopyrightText from '@/components/CopyrightText';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from '@/components/ui/sidebar';

const AppSidebar = () => {
  const { role } = useAuth();
  const { t, language } = useLanguage();
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
    { key: 'chats', label: t('nav.chats'), icon: MessageSquare, path: '/dashboard/chats', roles: ['admin', 'teacher', 'student'] },
  ];

  const items = allItems.filter((item) => role && item.roles.includes(role));

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
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="text-center space-y-1">
          <CopyrightText className="text-[10px] text-sidebar-foreground/50" />
          <p className="text-[10px] text-sidebar-foreground/40">v{APP_VERSION}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;