import { useState, useEffect } from 'react';
import { BookOpen, Users, GraduationCap, HeadphonesIcon, Calendar, CreditCard, MessageSquare, LayoutDashboard, Settings, ClipboardCheck, Award, BarChart3, Bell, Megaphone, FileText, LogOut, Calculator, ShieldCheck, Shield, Sparkles, AlertCircle, HardDrive, Globe, ScrollText, PenLine, Activity, Code, Webhook, Bug, ClipboardList, Route, FolderTree, Signal, ChevronDown, Building2, Flag, Library } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { resolveAvatarUrl } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from '@/components/ui/sidebar';

interface MenuItem {
  key: string;
  label: string;
  icon: any;
  path: string;
  roles: string[];
  comingSoon?: boolean;
  beta?: boolean;
  badgeKey?: string;
  children?: MenuItem[];
}

interface MenuCategory {
  label: string;
  labelAr: string;
  items: MenuItem[];
  requiresDeveloperMode?: boolean;
  requiresWebsiteMode?: boolean;
}

const AppSidebar = () => {
  const { role, profile, signOut, user } = useAuth();
  const { t, language } = useLanguage();
  const { appLogo, appName, sidebarMode, darkLogo, developerMode, websiteMode } = useAppSettings();
  const navigate = useNavigate();
  const isAr = language === 'ar';
  const location = useLocation();
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState('');
  const [unreadChats, setUnreadChats] = useState(0);
  const [hoveredMenus, setHoveredMenus] = useState<Set<string>>(new Set());
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profile?.avatar_url) {
      resolveAvatarUrl(profile.avatar_url).then(setResolvedAvatarUrl);
    }
  }, [profile?.avatar_url]);

  useEffect(() => {
    if (!user) return;
    const checkUnread = async () => {
      const lastCheck = localStorage.getItem('chat_last_check') || new Date(0).toISOString();
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', lastCheck)
        .neq('sender_id', user.id);
      setUnreadChats(count || 0);
    };
    checkUnread();
    const interval = setInterval(checkUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isDarkMode = document.documentElement.classList.contains('dark');
  const showDarkLogo = sidebarMode === 'light' ? false : (sidebarMode === 'dark' || isDarkMode) && darkLogo;
  const displayLogo = showDarkLogo ? darkLogo : appLogo;

  const categories: MenuCategory[] = [
    {
      label: 'Overview',
      labelAr: 'نظرة عامة',
      items: [
        { key: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'teacher', 'student'] },
      ],
    },
    {
      label: 'Educate',
      labelAr: 'التعليم',
      items: [
        { key: 'courses', label: t('nav.courses'), icon: BookOpen, path: '/dashboard/courses', roles: ['admin', 'teacher', 'student'], beta: true,
          children: [
            { key: 'tracks', label: isAr ? 'المسارات' : 'Tracks', icon: Route, path: '/dashboard/courses/tracks', roles: ['admin'] },
            { key: 'categories', label: isAr ? 'التصنيفات' : 'Categories', icon: FolderTree, path: '/dashboard/courses/categories', roles: ['admin'] },
            { key: 'levels', label: isAr ? 'المستويات' : 'Levels', icon: Signal, path: '/dashboard/courses/levels', roles: ['admin'] },
          ],
        },
        { key: 'timetable', label: t('nav.timetable'), icon: Calendar, path: '/dashboard/timetable', roles: ['admin', 'teacher', 'student'] },
        { key: 'certificates', label: isAr ? 'الشهادات' : 'Certificates', icon: Award, path: '/dashboard/certificates', roles: ['admin', 'teacher', 'student'], beta: true },
      ],
    },
    {
      label: 'Reports',
      labelAr: 'التقارير',
      items: [
        { key: 'attendance', label: isAr ? 'تتبع الحضور' : 'Attendance Tracking', icon: ClipboardCheck, path: '/dashboard/attendance', roles: ['admin', 'teacher'], beta: true },
        { key: 'reports', label: isAr ? 'التقارير والتحليلات' : 'Reports & Analytics', icon: BarChart3, path: '/dashboard/reports', roles: ['admin'] },
      ],
    },
    {
      label: 'Website',
      labelAr: 'الموقع',
      requiresWebsiteMode: true,
      items: [
        { key: 'landing-page', label: isAr ? 'صفحة الهبوط' : 'Landing Page', icon: Globe, path: '/dashboard/landing-page', roles: ['admin'] },
        { key: 'website-pages', label: isAr ? 'الصفحات الرئيسية' : 'Main Pages', icon: FileText, path: '/dashboard/website-pages', roles: ['admin'] },
        { key: 'blog', label: isAr ? 'المدونة' : 'Blogs', icon: PenLine, path: '/dashboard/blog', roles: ['admin'] },
        { key: 'policies', label: isAr ? 'السياسات' : 'Policies', icon: ScrollText, path: '/dashboard/policies', roles: ['admin'] },
      ],
    },
    {
      label: 'Media',
      labelAr: 'الوسائط',
      items: [
        { key: 'media', label: isAr ? 'الوسائط' : 'Media', icon: HardDrive, path: '/dashboard/media', roles: ['admin'] },
      ],
    },
    {
      label: 'Messages',
      labelAr: 'الرسائل',
      items: [
        { key: 'support', label: t('nav.support'), icon: HeadphonesIcon, path: '/dashboard/support', roles: ['admin'],
          children: [
            { key: 'support-departments', label: isAr ? 'الأقسام' : 'Departments', icon: Building2, path: '/dashboard/support/departments', roles: ['admin'] },
            { key: 'support-priorities', label: isAr ? 'الأولويات' : 'Priorities', icon: Flag, path: '/dashboard/support/priorities', roles: ['admin'] },
          ],
        },
        { key: 'chats', label: t('nav.chats'), icon: MessageSquare, path: '/dashboard/chats', roles: ['admin', 'teacher', 'student'], badgeKey: 'chats', beta: true },
        { key: 'announcements', label: isAr ? 'الإعلانات' : 'Announcements', icon: Megaphone, path: '/dashboard/announcements', roles: ['admin', 'teacher', 'student'] },
        { key: 'notifications', label: isAr ? 'الإشعارات' : 'Notifications', icon: Bell, path: '/dashboard/notifications', roles: ['admin', 'teacher', 'student'] },
      ],
    },
    {
      label: 'Users',
      labelAr: 'المستخدمون',
      items: [
        { key: 'admins', label: isAr ? 'المشرفون' : 'Admins', icon: ShieldCheck, path: '/dashboard/admins', roles: ['admin'] },
        { key: 'teachers', label: t('nav.teachers'), icon: Users, path: '/dashboard/teachers', roles: ['admin'] },
        { key: 'students', label: t('nav.students'), icon: GraduationCap, path: '/dashboard/students', roles: ['admin', 'teacher'] },
        { key: 'roles', label: isAr ? 'إدارة الأدوار' : 'Manage Roles', icon: Shield, path: '/dashboard/roles', roles: ['admin'], comingSoon: true },
      ],
    },
    {
      label: 'Finance',
      labelAr: 'المالية',
      items: [
        { key: 'subscriptions', label: t('nav.subscriptions'), icon: CreditCard, path: '/dashboard/subscriptions', roles: ['admin'] },
        { key: 'invoices', label: isAr ? 'الفواتير' : 'Invoices', icon: FileText, path: '/dashboard/invoices', roles: ['admin'] },
        { key: 'calculator', label: isAr ? 'الحاسبة' : 'Calculator', icon: Calculator, path: '/dashboard/calculator', roles: ['admin'] },
      ],
    },
    {
      label: 'Developer',
      labelAr: 'المطور',
      requiresDeveloperMode: true,
      items: [
        { key: 'error-docs', label: isAr ? 'توثيق الأخطاء' : 'Error Docs', icon: AlertCircle, path: '/dashboard/error-docs', roles: ['admin'] },
        { key: 'webhook-log', label: isAr ? 'سجل الويب هوك' : 'Webhook Log', icon: Webhook, path: '/dashboard/webhook-log', roles: ['admin'] },
        { key: 'activity-log', label: isAr ? 'سجل النشاطات' : 'Activity Log', icon: Activity, path: '/dashboard/activity-log', roles: ['admin'], comingSoon: true },
        { key: 'error-log', label: isAr ? 'سجل الأخطاء' : 'Error Log', icon: Bug, path: '/dashboard/error-log', roles: ['admin'] },
        { key: 'audit-trail', label: isAr ? 'سجل التدقيق' : 'Audit Trail', icon: ClipboardList, path: '/dashboard/audit-trail', roles: ['admin'] },
      ],
    },
  ];

  useEffect(() => {
    document.documentElement.setAttribute('data-sidebar-mode', sidebarMode);
  }, [sidebarMode]);

  return (
    <Sidebar side={isAr ? 'right' : 'left'}>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center">
          {displayLogo ? (
            <img src={displayLogo} alt="Logo" className="max-h-9 w-auto object-contain" />
          ) : (
            <span className="text-sm font-bold text-foreground truncate max-w-[160px]">{appName || 'Islamic Dashboard'}</span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {categories.map((cat) => {
          if (cat.requiresDeveloperMode && !developerMode) return null;
          if (cat.requiresWebsiteMode && !websiteMode) return null;
          const visibleItems = cat.items.filter((item) => role && item.roles.includes(role));
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={cat.label}>
              <SidebarGroupLabel>
                {isAr ? cat.labelAr : cat.label}
                {cat.requiresDeveloperMode && (
                  <Badge
                    className="text-[8px] px-1.5 py-0 h-3.5 ms-1.5 border border-border bg-muted text-muted-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={(e) => { e.stopPropagation(); navigate('/dashboard/settings?tab=developer'); }}
                  >
                    <span className="relative flex h-1.5 w-1.5 me-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    <Code className="h-2 w-2 me-0.5" />
                    DEV
                  </Badge>
                )}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const hasChildren = item.children && item.children.length > 0;
                    const isParentActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                    const visibleChildren = hasChildren ? item.children!.filter(c => role && c.roles.includes(role)) : [];
                    const isExpanded = hoveredMenus.has(item.key) || expandedMenus.has(item.key) || isParentActive;
                    return (
                      <SidebarMenuItem
                        key={item.key}
                        onMouseEnter={() => {
                          if (hasChildren) setHoveredMenus(prev => new Set(prev).add(item.key));
                        }}
                        onMouseLeave={() => {
                          if (hasChildren) setHoveredMenus(prev => {
                            const next = new Set(prev);
                            next.delete(item.key);
                            return next;
                          });
                        }}
                      >
                        <SidebarMenuButton
                          isActive={location.pathname === item.path}
                          onClick={() => navigate(item.path)}
                          tooltip={item.label}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="flex-1 text-start">{item.label}</span>
                          {item.comingSoon && (
                            <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 shrink-0 ms-auto">
                              <Sparkles className="h-2 w-2 me-0.5" />
                              {isAr ? 'قريباً' : 'Soon'}
                            </Badge>
                          )}
                          {item.beta && !item.comingSoon && (
                            <Badge className="text-[7px] px-1 py-0 h-3.5 shrink-0 ms-auto bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20">
                              Beta
                            </Badge>
                          )}
                          {hasChildren && (
                            <ChevronDown className={`h-3.5 w-3.5 text-sidebar-foreground/50 transition-transform duration-200 shrink-0 ms-auto ${isExpanded ? 'rotate-180' : ''}`} />
                          )}
                          {item.badgeKey === 'chats' && unreadChats > 0 && (
                            <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4 min-w-[18px] shrink-0 ms-auto">
                              {unreadChats > 99 ? '99+' : unreadChats}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                        {visibleChildren.length > 0 && (
                          <div
                            className="grid transition-[grid-template-rows] duration-200 ease-out"
                            style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                          >
                            <div className="overflow-hidden">
                              <SidebarMenu className="ms-4 mt-0.5 border-s border-border ps-2 w-[90%]">
                                {visibleChildren.map((child) => (
                                  <SidebarMenuItem key={child.key}>
                                    <SidebarMenuButton
                                      isActive={location.pathname === child.path}
                                      onClick={() => navigate(child.path)}
                                      tooltip={child.label}
                                      className="h-7 text-xs"
                                    >
                                      <child.icon className="h-3.5 w-3.5" />
                                      <span>{child.label}</span>
                                    </SidebarMenuButton>
                                  </SidebarMenuItem>
                                ))}
                              </SidebarMenu>
                            </div>
                          </div>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-3 space-y-2">
          <div
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors"
            onClick={() => navigate('/dashboard/settings')}
          >
            <Settings className="h-5 w-5 text-sidebar-foreground/60" />
            <span className="text-sm text-sidebar-foreground/80">{isAr ? 'إعدادات التطبيق' : 'App Settings'}</span>
          </div>
          <div
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors"
            onClick={() => navigate('/dashboard/profile')}
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={resolvedAvatarUrl} />
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
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogout();
                    }}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-sidebar-foreground/50 hover:text-destructive transition-colors"
                  >
                    <LogOut className="h-4 w-4 rtl:-scale-x-100" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side={isAr ? 'right' : 'left'}>{isAr ? 'تسجيل الخروج' : 'Logout'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
