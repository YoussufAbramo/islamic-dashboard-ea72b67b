import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  GraduationCap, BookOpen, FileText, Globe, ScrollText, PenLine,
  LayoutDashboard, Users, CreditCard, HeadphonesIcon, Calendar,
  MessageSquare, ClipboardCheck, Award, BarChart3, Bell, Megaphone,
  Settings, Calculator, Shield, ShieldCheck, HardDrive, Webhook,
  Bug, ClipboardList, Activity, AlertCircle,
} from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  path: string;
  category: string;
}

const PAGES: SearchResult[] = [
  { id: 'p-dashboard', title: 'Dashboard', subtitle: 'لوحة التحكم', icon: LayoutDashboard, path: '/dashboard', category: 'pages' },
  { id: 'p-courses', title: 'Courses', subtitle: 'الدورات', icon: BookOpen, path: '/dashboard/courses', category: 'pages' },
  { id: 'p-students', title: 'Students', subtitle: 'الطلاب', icon: GraduationCap, path: '/dashboard/students', category: 'pages' },
  { id: 'p-teachers', title: 'Teachers', subtitle: 'المعلمون', icon: Users, path: '/dashboard/teachers', category: 'pages' },
  { id: 'p-admins', title: 'Admins', subtitle: 'المشرفون', icon: ShieldCheck, path: '/dashboard/admins', category: 'pages' },
  { id: 'p-subscriptions', title: 'Subscriptions', subtitle: 'الاشتراكات', icon: CreditCard, path: '/dashboard/subscriptions', category: 'pages' },
  { id: 'p-invoices', title: 'Invoices', subtitle: 'الفواتير', icon: FileText, path: '/dashboard/invoices', category: 'pages' },
  { id: 'p-timetable', title: 'Timetable', subtitle: 'الجدول الزمني', icon: Calendar, path: '/dashboard/timetable', category: 'pages' },
  { id: 'p-attendance', title: 'Attendance', subtitle: 'الحضور', icon: ClipboardCheck, path: '/dashboard/attendance', category: 'pages' },
  { id: 'p-certificates', title: 'Certificates', subtitle: 'الشهادات', icon: Award, path: '/dashboard/certificates', category: 'pages' },
  { id: 'p-chats', title: 'Chats', subtitle: 'المحادثات', icon: MessageSquare, path: '/dashboard/chats', category: 'pages' },
  { id: 'p-support', title: 'Support', subtitle: 'الدعم', icon: HeadphonesIcon, path: '/dashboard/support', category: 'pages' },
  { id: 'p-reports', title: 'Reports', subtitle: 'التقارير', icon: BarChart3, path: '/dashboard/reports', category: 'pages' },
  { id: 'p-calculator', title: 'Calculator', subtitle: 'الحاسبة', icon: Calculator, path: '/dashboard/calculator', category: 'pages' },
  { id: 'p-announcements', title: 'Announcements', subtitle: 'الإعلانات', icon: Megaphone, path: '/dashboard/announcements', category: 'pages' },
  { id: 'p-notifications', title: 'Notifications', subtitle: 'الإشعارات', icon: Bell, path: '/dashboard/notifications', category: 'pages' },
  { id: 'p-settings', title: 'Settings', subtitle: 'الإعدادات', icon: Settings, path: '/dashboard/settings', category: 'pages' },
  { id: 'p-roles', title: 'Manage Roles', subtitle: 'إدارة الأدوار', icon: Shield, path: '/dashboard/roles', category: 'pages' },
  { id: 'p-landing', title: 'Landing Page', subtitle: 'صفحة الهبوط', icon: Globe, path: '/dashboard/landing-page', category: 'pages' },
  { id: 'p-policies', title: 'Policies', subtitle: 'السياسات', icon: ScrollText, path: '/dashboard/policies', category: 'pages' },
  { id: 'p-pages', title: 'Website Pages', subtitle: 'الصفحات', icon: FileText, path: '/dashboard/website-pages', category: 'pages' },
  { id: 'p-blog', title: 'Blog', subtitle: 'المدونة', icon: PenLine, path: '/dashboard/blog', category: 'pages' },
  { id: 'p-media', title: 'Media', subtitle: 'الوسائط', icon: HardDrive, path: '/dashboard/media', category: 'pages' },
  { id: 'p-error-docs', title: 'Error Docs', subtitle: 'توثيق الأخطاء', icon: AlertCircle, path: '/dashboard/error-docs', category: 'pages' },
  { id: 'p-webhook', title: 'Webhook Log', subtitle: 'سجل الويب هوك', icon: Webhook, path: '/dashboard/webhook-log', category: 'pages' },
  { id: 'p-error-log', title: 'Error Log', subtitle: 'سجل الأخطاء', icon: Bug, path: '/dashboard/error-log', category: 'pages' },
  { id: 'p-audit', title: 'Audit Trail', subtitle: 'سجل التدقيق', icon: ClipboardList, path: '/dashboard/audit-trail', category: 'pages' },
  { id: 'p-activity', title: 'Activity Log', subtitle: 'سجل النشاطات', icon: Activity, path: '/dashboard/activity-log', category: 'pages' },
];

const GlobalSearch = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { role } = useAuth();
  const isAr = language === 'ar';

  const [invoices, setInvoices] = useState<SearchResult[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadData = useCallback(async () => {
    if (loaded) return;

    const invoicesRes = role === 'admin'
      ? await supabase.from('invoices').select('id, invoice_number, amount, status, students:invoices_student_id_fkey(user_id, profiles:students_user_id_profiles_fkey(full_name))').limit(200)
      : { data: [] };

    setInvoices(
      (invoicesRes.data || []).map((inv: any) => ({
        id: `i-${inv.id}`,
        title: inv.invoice_number,
        subtitle: `${inv.students?.profiles?.full_name || ''} — ${inv.status}`,
        icon: FileText,
        path: '/dashboard/invoices',
        category: 'invoices',
      }))
    );

    setLoaded(true);
  }, [loaded, role, isAr]);

  useEffect(() => {
    if (open) loadData();
  }, [open, loadData]);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const categoryLabel = (cat: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      pages: { en: 'Pages', ar: 'الصفحات' },
      students: { en: 'Students', ar: 'الطلاب' },
      courses: { en: 'Courses', ar: 'الدورات' },
      invoices: { en: 'Invoices', ar: 'الفواتير' },
    };
    return isAr ? labels[cat]?.ar : labels[cat]?.en;
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={isAr ? 'ابحث عن صفحات، طلاب، دورات...' : 'Search pages, students, courses...'} />
      <CommandList>
        <CommandEmpty>{isAr ? 'لا توجد نتائج' : 'No results found.'}</CommandEmpty>

        <CommandGroup heading={categoryLabel('pages')}>
          {PAGES.map(page => (
            <CommandItem key={page.id} value={`${page.title} ${page.subtitle || ''}`} onSelect={() => handleSelect(page.path)}>
              <page.icon className="me-2 h-4 w-4 text-muted-foreground shrink-0" />
              <span>{isAr && page.subtitle ? page.subtitle : page.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {students.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={categoryLabel('students')}>
              {students.map(s => (
                <CommandItem key={s.id} value={`${s.title} ${s.subtitle}`} onSelect={() => handleSelect(s.path)}>
                  <s.icon className="me-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col">
                    <span>{s.title}</span>
                    {s.subtitle && <span className="text-xs text-muted-foreground">{s.subtitle}</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {courses.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={categoryLabel('courses')}>
              {courses.map(c => (
                <CommandItem key={c.id} value={`${c.title} ${c.subtitle}`} onSelect={() => handleSelect(c.path)}>
                  <c.icon className="me-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{c.title}</span>
                  {c.subtitle && <span className="ms-2 text-xs text-muted-foreground">{c.subtitle}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {invoices.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={categoryLabel('invoices')}>
              {invoices.map(inv => (
                <CommandItem key={inv.id} value={`${inv.title} ${inv.subtitle}`} onSelect={() => handleSelect(inv.path)}>
                  <inv.icon className="me-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{inv.title}</span>
                  {inv.subtitle && <span className="ms-2 text-xs text-muted-foreground truncate">{inv.subtitle}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearch;
