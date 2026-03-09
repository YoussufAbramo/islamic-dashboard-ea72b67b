import { BookOpen, Users, GraduationCap, HeadphonesIcon, Calendar, CreditCard, MessageSquare, LayoutDashboard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from '@/components/ui/sidebar';

const AppSidebar = () => {
  const { role } = useAuth();
  const { t } = useLanguage();
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
    <Sidebar>
      <SidebarHeader className="p-4">
        <h2 className="text-lg font-bold text-sidebar-foreground">EduDash</h2>
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
    </Sidebar>
  );
};

export default AppSidebar;
