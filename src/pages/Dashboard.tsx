import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { BookOpen, Users, GraduationCap, CreditCard, HeadphonesIcon, Calendar as CalendarIcon, DollarSign, AlertTriangle, Pencil, Award, ClipboardCheck, MessageSquare, UserCheck, Megaphone, ArrowUp, ArrowDown, GripVertical, ChevronLeft, ChevronRight, FileText, TrendingUp } from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths, addWeeks, eachDayOfInterval, isToday, isSameMonth } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, alert, onClick }: { title: string; value: number | string; icon: any; alert?: boolean; onClick?: () => void }) => (
  <Card className={`hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200 cursor-pointer hover:border-primary/40 hover:shadow-primary/10 ${alert ? 'border-destructive/50' : ''}`} onClick={onClick}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${alert ? 'text-destructive' : 'text-muted-foreground'}`} />
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${alert ? 'text-destructive' : ''}`}>{value}</div>
    </CardContent>
  </Card>
);

interface TimetableEntry {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  course_id: string | null;
  teacher_id: string | null;
}

type WidgetKey =
  | 'statCourses' | 'statStudents' | 'statTeachers' | 'statSubscriptions'
  | 'statTickets' | 'statLessons' | 'statWeeklyLessons' | 'statMri'
  | 'attendanceOverview' | 'certificatesIssued' | 'supportOverview'
  | 'teacherOverview' | 'announcementsWidget' | 'chatsOverview'
  | 'calendar' | 'upcomingLessons' | 'recentActivity'
  | 'recentSubscriptions' | 'topStudents'
  | 'salesGraph' | 'attendanceGraph';

const DEFAULT_WIDGETS: Record<WidgetKey, boolean> = {
  statCourses: true, statStudents: true, statTeachers: true, statSubscriptions: true,
  statTickets: true, statLessons: true, statWeeklyLessons: true, statMri: true,
  attendanceOverview: true, certificatesIssued: true, supportOverview: true,
  teacherOverview: true, announcementsWidget: true, chatsOverview: true,
  calendar: true, upcomingLessons: true, recentActivity: true,
  recentSubscriptions: true, topStudents: true,
  salesGraph: true, attendanceGraph: true,
};

const WIDGET_LABELS: Record<WidgetKey, { en: string; ar: string }> = {
  statCourses: { en: 'Courses Count', ar: 'عدد الدورات' },
  statStudents: { en: 'Students Count', ar: 'عدد الطلاب' },
  statTeachers: { en: 'Teachers Count', ar: 'عدد المعلمين' },
  statSubscriptions: { en: 'Active Subscriptions', ar: 'الاشتراكات النشطة' },
  statTickets: { en: 'Open Tickets', ar: 'التذاكر المفتوحة' },
  statLessons: { en: 'Upcoming Lessons', ar: 'الدروس القادمة' },
  statWeeklyLessons: { en: 'Weekly Lessons', ar: 'دروس الأسبوع' },
  statMri: { en: 'Monthly Income', ar: 'الدخل الشهري' },
  attendanceOverview: { en: 'Attendance Card', ar: 'بطاقة الحضور' },
  certificatesIssued: { en: 'Certificates Card', ar: 'بطاقة الشهادات' },
  supportOverview: { en: 'Support Card', ar: 'بطاقة الدعم' },
  teacherOverview: { en: 'Teachers Card', ar: 'بطاقة المعلمين' },
  announcementsWidget: { en: 'Announcements Card', ar: 'بطاقة الإعلانات' },
  chatsOverview: { en: 'Chats Card', ar: 'بطاقة المحادثات' },
  calendar: { en: 'Lessons Calendar', ar: 'تقويم الدروس' },
  upcomingLessons: { en: 'Upcoming Lessons List', ar: 'قائمة الدروس القادمة' },
  recentActivity: { en: 'Recent Activity', ar: 'النشاط الأخير' },
  recentSubscriptions: { en: 'Recent Subscriptions', ar: 'الاشتراكات الأخيرة' },
  topStudents: { en: 'Top Students', ar: 'أفضل الطلاب' },
  salesGraph: { en: 'Sales Performance', ar: 'أداء المبيعات' },
  attendanceGraph: { en: 'Attendance Performance', ar: 'أداء الحضور' },
};

interface WidgetCategory { label: string; labelAr: string; keys: WidgetKey[]; }

type SectionKey = 'graphs' | 'stats' | 'overview' | 'upcomingLessons' | 'recentSubscriptions' | 'calendar' | 'recentActivity';

const DEFAULT_SECTION_ORDER: SectionKey[] = ['graphs', 'stats', 'overview', 'upcomingLessons', 'recentSubscriptions', 'calendar', 'recentActivity'];

const SECTION_LABELS: Record<SectionKey, { en: string; ar: string }> = {
  graphs: { en: '📈 Performance Graphs', ar: '📈 رسوم الأداء' },
  stats: { en: '📊 Statistics Cards', ar: '📊 بطاقات الإحصائيات' },
  overview: { en: '📋 Overview Cards', ar: '📋 بطاقات النظرة العامة' },
  upcomingLessons: { en: '📅 Upcoming Lessons', ar: '📅 الدروس القادمة' },
  recentSubscriptions: { en: '💳 Recent Subscriptions', ar: '💳 أحدث الاشتراكات' },
  calendar: { en: '🗓️ Lessons Calendar', ar: '🗓️ تقويم الدروس' },
  recentActivity: { en: '⚡ Recent Activity', ar: '⚡ النشاط الأخير' },
};

const WIDGET_CATEGORIES: WidgetCategory[] = [
  { label: '📈 Performance Graphs', labelAr: '📈 رسوم الأداء', keys: ['salesGraph', 'attendanceGraph'] },
  { label: '📊 Statistics Cards', labelAr: '📊 بطاقات الإحصائيات', keys: ['statCourses', 'statStudents', 'statTeachers', 'statSubscriptions', 'statTickets', 'statLessons', 'statWeeklyLessons', 'statMri'] },
  { label: '📋 Overview Cards', labelAr: '📋 بطاقات النظرة العامة', keys: ['attendanceOverview', 'certificatesIssued', 'supportOverview', 'teacherOverview', 'announcementsWidget', 'chatsOverview'] },
  { label: '📅 Schedule & Activity', labelAr: '📅 الجدول والنشاط', keys: ['calendar', 'upcomingLessons', 'recentActivity', 'recentSubscriptions', 'topStudents'] },
];

function migrateWidgets(saved: any): Record<WidgetKey, boolean> {
  const result = { ...DEFAULT_WIDGETS };
  if (saved) {
    if ('stats' in saved) {
      const statsVal = saved.stats;
      (['statCourses', 'statStudents', 'statTeachers', 'statSubscriptions', 'statTickets', 'statLessons', 'statWeeklyLessons', 'statMri'] as WidgetKey[]).forEach(k => { result[k] = statsVal; });
    }
    if ('quickActions' in saved) { result.chatsOverview = saved.quickActions; }
    for (const key of Object.keys(result) as WidgetKey[]) {
      if (key in saved) { result[key] = saved[key]; }
    }
  }
  return result;
}

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--primary) / 0.7)', 'hsl(var(--primary) / 0.5)', 'hsl(var(--primary) / 0.3)'];

const Dashboard = () => {
  const { role, profile } = useAuth();
  const { t, language } = useLanguage();
  const { currency } = useAppSettings();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ courses: 0, students: 0, teachers: 0, subscriptions: 0, tickets: 0, lessons: 0, mri: 0, weeklyLessons: 0, teacherAbsences: 0, certificates: 0, attendance: 0, chats: 0, announcements: 0, invoices: 0, pendingInvoices: 0 });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMode, setCalendarMode] = useState<'monthly' | 'weekly'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [dayLessons, setDayLessons] = useState<TimetableEntry[]>([]);
  const [recentSubs, setRecentSubs] = useState<any[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [widgets, setWidgets] = useState<Record<WidgetKey, boolean>>(() => {
    const saved = localStorage.getItem('dashboard_widgets');
    return migrateWidgets(saved ? JSON.parse(saved) : null);
  });
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(() => {
    const saved = localStorage.getItem('dashboard_section_order');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure 'graphs' is included
      if (!parsed.includes('graphs')) return ['graphs', ...parsed];
      return parsed;
    }
    return DEFAULT_SECTION_ORDER;
  });
  const isAr = language === 'ar';
  const isAdmin = role === 'admin';

  const toggleWidget = useCallback((key: WidgetKey) => {
    setWidgets(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('dashboard_widgets', JSON.stringify(next));
      return next;
    });
  }, []);

  const moveSection = useCallback((index: number, direction: 'up' | 'down') => {
    setSectionOrder(prev => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      localStorage.setItem('dashboard_section_order', JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const fetchStats = async () => {
      const [courses, students, teachers, subs, tickets, timetable, weeklyEntries, certs, attendanceCount, chatCount, announcementsCount, invoicesCount, pendingInvoicesCount] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('teachers').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id, price, created_at', { count: 'exact' }).eq('status', 'active'),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('timetable_entries').select('id', { count: 'exact', head: true }).gte('scheduled_at', now.toISOString()),
        supabase.from('timetable_entries').select('id, status').gte('scheduled_at', weekStart.toISOString()).lte('scheduled_at', weekEnd.toISOString()),
        supabase.from('certificates').select('id', { count: 'exact', head: true }),
        supabase.from('attendance').select('id', { count: 'exact', head: true }),
        supabase.from('chats').select('id', { count: 'exact', head: true }),
        supabase.from('announcements').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('invoices').select('id', { count: 'exact', head: true }),
        supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      const subsData = subs.data || [];
      const mri = subsData.reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0);
      const weekData = weeklyEntries.data || [];
      const absences = weekData.filter((e: any) => e.status === 'cancelled').length;

      setStats({
        courses: courses.count || 0, students: students.count || 0, teachers: teachers.count || 0,
        subscriptions: subs.count || 0, tickets: tickets.count || 0, lessons: timetable.count || 0,
        mri, weeklyLessons: weekData.length, teacherAbsences: absences,
        certificates: certs.count || 0, attendance: attendanceCount.count || 0,
        chats: chatCount.count || 0, announcements: announcementsCount.count || 0,
        invoices: invoicesCount.count || 0, pendingInvoices: pendingInvoicesCount.count || 0,
      });

      // Build sales data by month (last 6 months)
      const monthlyData: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const key = format(d, 'MMM');
        monthlyData[key] = 0;
      }
      subsData.forEach((s: any) => {
        const key = format(new Date(s.created_at), 'MMM');
        if (key in monthlyData) monthlyData[key] += Number(s.price) || 0;
      });
      setSalesData(Object.entries(monthlyData).map(([month, revenue]) => ({ month, revenue })));
    };

    const fetchAttendanceStats = async () => {
      const { data } = await supabase.from('attendance').select('status');
      const statusCounts: Record<string, number> = { present: 0, absent: 0, late: 0, excused: 0 };
      (data || []).forEach((a: any) => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });
      setAttendanceData(Object.entries(statusCounts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })));
    };

    const fetchTimetable = async () => {
      const { data } = await supabase.from('timetable_entries').select('id, scheduled_at, duration_minutes, status, course_id, teacher_id').order('scheduled_at', { ascending: true });
      setTimetableEntries(data || []);
    };

    const fetchRecent = async () => {
      const { data: subsData } = await supabase.from('subscriptions').select('*, courses:course_id(title)').order('created_at', { ascending: false }).limit(5);
      setRecentSubs(subsData || []);
      const { data: annData } = await supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(3);
      setRecentAnnouncements(annData || []);
    };

    fetchStats();
    fetchAttendanceStats();
    fetchTimetable();
    fetchRecent();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const filtered = timetableEntries.filter(e => isSameDay(new Date(e.scheduled_at), selectedDate));
      setDayLessons(filtered);
    }
  }, [selectedDate, timetableEntries]);

  const upcomingEntries = timetableEntries.filter(e => new Date(e.scheduled_at) >= new Date()).slice(0, 5);

  const hasAnyStat = (['statCourses', 'statStudents', 'statTeachers', 'statSubscriptions', 'statTickets', 'statLessons', 'statWeeklyLessons', 'statMri'] as WidgetKey[]).some(k => widgets[k]);

  const calendarDays = useMemo(() => {
    if (calendarMode === 'monthly') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: calStart, end: calEnd });
    } else {
      const wStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const wEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: wStart, end: wEnd });
    }
  }, [currentDate, calendarMode]);

  const navigateCalendar = (dir: 'prev' | 'next') => {
    if (calendarMode === 'monthly') {
      setCurrentDate(prev => addMonths(prev, dir === 'next' ? 1 : -1));
    } else {
      setCurrentDate(prev => addWeeks(prev, dir === 'next' ? 1 : -1));
    }
  };

  const getLessonCountForDay = (date: Date) => timetableEntries.filter(e => isSameDay(new Date(e.scheduled_at), date)).length;

  const weekDays = isAr
    ? ['اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت', 'أحد']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const salesChartConfig = { revenue: { label: isAr ? 'الإيرادات' : 'Revenue', color: 'hsl(var(--primary))' } };
  const attendanceChartConfig = { present: { label: isAr ? 'حاضر' : 'Present', color: 'hsl(var(--primary))' }, absent: { label: isAr ? 'غائب' : 'Absent', color: 'hsl(var(--destructive))' }, late: { label: isAr ? 'متأخر' : 'Late', color: 'hsl(var(--primary) / 0.5)' }, excused: { label: isAr ? 'معذور' : 'Excused', color: 'hsl(var(--primary) / 0.3)' } };
  const attendancePieColors = ['hsl(var(--primary))', 'hsl(0 84% 60%)', 'hsl(var(--primary) / 0.5)', 'hsl(var(--primary) / 0.3)'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('dashboard.welcome')}, {profile?.full_name || 'User'}</h1>
        {isAdmin && (
          <Button variant={editMode ? 'default' : 'outline'} size="sm" className={!editMode ? 'hover:bg-primary hover:text-primary-foreground transition-colors' : ''} onClick={() => setEditMode(!editMode)}>
            <Pencil className="h-4 w-4 me-1" />
            {editMode ? (isAr ? 'تم' : 'Done') : (isAr ? 'إدارة لوحة التحكم' : 'Manage Dashboard')}
          </Button>
        )}
      </div>

      {editMode && isAdmin && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2 text-primary">{isAr ? '🔀 ترتيب الأقسام' : '🔀 Section Order'}</p>
              <div className="space-y-1">
                {sectionOrder.map((sKey, idx) => (
                  <div key={sKey} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs flex-1">{isAr ? SECTION_LABELS[sKey].ar : SECTION_LABELS[sKey].en}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={idx === 0} onClick={() => moveSection(idx, 'up')}><ArrowUp className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={idx === sectionOrder.length - 1} onClick={() => moveSection(idx, 'down')}><ArrowDown className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            </div>
            {WIDGET_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <p className="text-sm font-semibold mb-2 text-primary">{isAr ? cat.labelAr : cat.label}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {cat.keys.map((key) => (
                    <div key={key} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border bg-background">
                      <span className="text-xs">{isAr ? WIDGET_LABELS[key].ar : WIDGET_LABELS[key].en}</span>
                      <Switch checked={widgets[key]} onCheckedChange={() => toggleWidget(key)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {role === 'teacher' && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title={t('dashboard.myStudents')} value={stats.students} icon={GraduationCap} onClick={() => navigate('/dashboard/students')} />
          <StatCard title={t('dashboard.myCourses')} value={stats.courses} icon={BookOpen} onClick={() => navigate('/dashboard/courses')} />
          <StatCard title={t('dashboard.upcomingLessons')} value={stats.lessons} icon={CalendarIcon} onClick={() => navigate('/dashboard/timetable')} />
        </div>
      )}

      {role === 'student' && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title={t('dashboard.myCourses')} value={stats.courses} icon={BookOpen} onClick={() => navigate('/dashboard/courses')} />
          <StatCard title={t('dashboard.mySchedule')} value={stats.lessons} icon={CalendarIcon} onClick={() => navigate('/dashboard/timetable')} />
          <StatCard title={t('dashboard.activeSubscriptions')} value={stats.subscriptions} icon={CreditCard} onClick={() => navigate('/dashboard/subscriptions')} />
        </div>
      )}

      {isAdmin && sectionOrder.map((sectionKey) => {
        switch (sectionKey) {
          case 'graphs': {
            const showSales = widgets.salesGraph;
            const showAttendance = widgets.attendanceGraph;
            if (!showSales && !showAttendance) return null;
            return (
              <div key={sectionKey} className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {showSales && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" />{isAr ? 'أداء المبيعات' : 'Sales Performance'}</CardTitle></CardHeader>
                    <CardContent>
                      <ChartContainer config={salesChartConfig} className="h-[250px] w-full">
                        <BarChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis className="text-xs" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}
                {showAttendance && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" />{isAr ? 'أداء الحضور' : 'Attendance Performance'}</CardTitle></CardHeader>
                    <CardContent>
                      <ChartContainer config={attendanceChartConfig} className="h-[250px] w-full">
                        <PieChart>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Pie data={attendanceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {attendanceData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={attendancePieColors[index % attendancePieColors.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          }

          case 'stats':
            return hasAnyStat ? (
              <div key={sectionKey} className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {widgets.statCourses && <StatCard title={t('dashboard.totalCourses')} value={stats.courses} icon={BookOpen} onClick={() => navigate('/dashboard/courses')} />}
                {widgets.statStudents && <StatCard title={t('dashboard.totalStudents')} value={stats.students} icon={GraduationCap} onClick={() => navigate('/dashboard/students')} />}
                {widgets.statTeachers && <StatCard title={t('dashboard.totalTeachers')} value={stats.teachers} icon={Users} onClick={() => navigate('/dashboard/teachers')} />}
                {widgets.statSubscriptions && <StatCard title={t('dashboard.activeSubscriptions')} value={stats.subscriptions} icon={CreditCard} onClick={() => navigate('/dashboard/subscriptions')} />}
                {widgets.statTickets && <StatCard title={t('dashboard.openTickets')} value={stats.tickets} icon={HeadphonesIcon} onClick={() => navigate('/dashboard/support')} />}
                {widgets.statLessons && <StatCard title={t('dashboard.upcomingLessons')} value={stats.lessons} icon={CalendarIcon} onClick={() => navigate('/dashboard/timetable')} />}
                {widgets.statWeeklyLessons && <StatCard title={isAr ? 'دروس هذا الأسبوع' : 'Lessons This Week'} value={stats.weeklyLessons} icon={CalendarIcon} onClick={() => navigate('/dashboard/timetable')} />}
                {widgets.statMri && <StatCard title={isAr ? 'الدخل الشهري المتكرر' : 'Monthly Recurring Income'} value={`${currency.symbol}${stats.mri.toFixed(2)}`} icon={DollarSign} onClick={() => navigate('/dashboard/reports')} />}
                {stats.teacherAbsences > 0 && <StatCard title={isAr ? 'غيابات المعلمين' : 'Teacher Absences'} value={stats.teacherAbsences} icon={AlertTriangle} alert onClick={() => navigate('/dashboard/attendance')} />}
              </div>
            ) : null;

          case 'overview':
            return (
              <div key={sectionKey} className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {widgets.attendanceOverview && (
                  <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dashboard/attendance')}>
                    <CardContent className="pt-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><ClipboardCheck className="h-5 w-5 text-primary" /></div>
                      <div><p className="text-sm font-medium">{isAr ? 'الحضور' : 'Attendance'}</p><p className="text-xs text-muted-foreground">{stats.attendance} {isAr ? 'سجل' : 'records'}</p></div>
                    </CardContent>
                  </Card>
                )}
                {widgets.certificatesIssued && (
                  <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dashboard/certificates')}>
                    <CardContent className="pt-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Award className="h-5 w-5 text-primary" /></div>
                      <div><p className="text-sm font-medium">{isAr ? 'الشهادات' : 'Certificates'}</p><p className="text-xs text-muted-foreground">{stats.certificates} {isAr ? 'صادرة' : 'issued'}</p></div>
                    </CardContent>
                  </Card>
                )}
                {widgets.supportOverview && (
                  <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dashboard/support')}>
                    <CardContent className="pt-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><HeadphonesIcon className="h-5 w-5 text-primary" /></div>
                      <div><p className="text-sm font-medium">{isAr ? 'الدعم الفني' : 'Support'}</p><p className="text-xs text-muted-foreground">{stats.tickets} {isAr ? 'تذاكر مفتوحة' : 'open tickets'}</p></div>
                    </CardContent>
                  </Card>
                )}
                {widgets.teacherOverview && (
                  <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dashboard/teachers')}>
                    <CardContent className="pt-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Users className="h-5 w-5 text-primary" /></div>
                      <div><p className="text-sm font-medium">{isAr ? 'المعلمون' : 'Teachers'}</p><p className="text-xs text-muted-foreground">{stats.teachers} {isAr ? 'معلم' : 'teachers'}</p></div>
                    </CardContent>
                  </Card>
                )}
                {widgets.announcementsWidget && (
                  <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dashboard/announcements')}>
                    <CardContent className="pt-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Megaphone className="h-5 w-5 text-primary" /></div>
                      <div><p className="text-sm font-medium">{isAr ? 'الإعلانات' : 'Announcements'}</p><p className="text-xs text-muted-foreground">{stats.announcements} {isAr ? 'نشط' : 'active'}</p></div>
                    </CardContent>
                  </Card>
                )}
                {widgets.chatsOverview && (
                  <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dashboard/chats')}>
                    <CardContent className="pt-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><MessageSquare className="h-5 w-5 text-primary" /></div>
                      <div><p className="text-sm font-medium">{isAr ? 'المحادثات' : 'Chats'}</p><p className="text-xs text-muted-foreground">{stats.chats} {isAr ? 'محادثة' : 'chats'}</p></div>
                    </CardContent>
                  </Card>
                )}
                {/* Invoices overview card */}
                <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dashboard/invoices')}>
                  <CardContent className="pt-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><FileText className="h-5 w-5 text-primary" /></div>
                    <div><p className="text-sm font-medium">{isAr ? 'الفواتير' : 'Invoices'}</p><p className="text-xs text-muted-foreground">{stats.invoices} {isAr ? 'فاتورة' : 'total'}</p></div>
                  </CardContent>
                </Card>
                {/* Pending Invoices card */}
                <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dashboard/invoices')}>
                  <CardContent className="pt-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><TrendingUp className="h-5 w-5 text-primary" /></div>
                    <div><p className="text-sm font-medium">{isAr ? 'فواتير معلقة' : 'Pending Invoices'}</p><p className="text-xs text-muted-foreground">{stats.pendingInvoices} {isAr ? 'معلقة' : 'pending'}</p></div>
                  </CardContent>
                </Card>
              </div>
            );

          case 'upcomingLessons': {
            const showUpcoming = widgets.upcomingLessons && upcomingEntries.length > 0;
            const showRecentSubs = widgets.recentSubscriptions && recentSubs.length > 0;
            if (!showUpcoming && !showRecentSubs) return null;
            return (
              <div key={sectionKey} className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {showUpcoming && (
                  <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dashboard/timetable')}>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-primary" />{isAr ? 'الدروس القادمة' : 'Upcoming Lessons'}</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {upcomingEntries.map(entry => (
                          <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg border border-border">
                            <div>
                              <p className="text-sm font-medium">{format(new Date(entry.scheduled_at), 'EEE, MMM d')}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(entry.scheduled_at), 'HH:mm')} · {entry.duration_minutes} {t('common.minutes')}</p>
                            </div>
                            <Badge variant={entry.status === 'cancelled' ? 'destructive' : 'outline'} className="text-[10px]">{entry.status === 'scheduled' ? (isAr ? 'مجدول' : 'Scheduled') : entry.status === 'completed' ? (isAr ? 'مكتمل' : 'Completed') : entry.status === 'cancelled' ? (isAr ? 'ملغي' : 'Cancelled') : entry.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {showRecentSubs && (
                  <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dashboard/subscriptions')}>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" />{isAr ? 'أحدث الاشتراكات' : 'Recent Subscriptions'}</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {recentSubs.map(sub => (
                          <div key={sub.id} className="flex items-center justify-between p-2 rounded-lg border border-border">
                            <div>
                              <p className="text-sm font-medium">{(sub.courses as any)?.title || '—'}</p>
                              <p className="text-xs text-muted-foreground">{sub.subscription_type} · {currency.symbol}{Number(sub.price || 0).toFixed(0)}</p>
                            </div>
                            <Badge variant={sub.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{sub.status === 'active' ? (isAr ? 'نشط' : 'Active') : sub.status === 'expired' ? (isAr ? 'منتهي' : 'Expired') : sub.status === 'cancelled' ? (isAr ? 'ملغي' : 'Cancelled') : sub.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          }

          case 'recentSubscriptions':
            return null;

          case 'calendar':
            return widgets.calendar ? (
              <div key={sectionKey} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">{isAr ? 'تقويم الدروس' : 'Lessons Calendar'}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 border rounded-lg p-1">
                      <Button variant={calendarMode === 'monthly' ? 'default' : 'ghost'} size="sm" onClick={() => setCalendarMode('monthly')}>
                        {isAr ? 'شهري' : 'Monthly'}
                      </Button>
                      <Button variant={calendarMode === 'weekly' ? 'default' : 'ghost'} size="sm" onClick={() => setCalendarMode('weekly')}>
                        {isAr ? 'أسبوعي' : 'Weekly'}
                      </Button>
                    </div>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateCalendar('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[140px] text-center">
                      {calendarMode === 'monthly'
                        ? format(currentDate, 'MMMM yyyy')
                        : `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
                      }
                    </span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateCalendar('next')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}>
                      {isAr ? 'اليوم' : 'Today'}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                  <Card className="lg:col-span-2">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-7 gap-1 mb-1">
                        {weekDays.map(d => (
                          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day) => {
                          const count = getLessonCountForDay(day);
                          const isSelected = isSameDay(day, selectedDate);
                          const isCurrentMonth = calendarMode === 'monthly' ? isSameMonth(day, currentDate) : true;
                          return (
                            <button
                              key={day.toISOString()}
                              onClick={() => setSelectedDate(day)}
                              className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all min-h-[60px] ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground shadow-md'
                                  : isToday(day)
                                  ? 'bg-primary/10 text-primary border border-primary/30'
                                  : isCurrentMonth
                                  ? 'hover:bg-muted text-foreground'
                                  : 'text-muted-foreground/40'
                              }`}
                            >
                              <span className="text-sm font-medium">{format(day, 'd')}</span>
                              {count > 0 && (
                                <div className="flex gap-0.5 mt-1">
                                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                                  ))}
                                  {count > 3 && <span className={`text-[8px] ${isSelected ? 'text-primary-foreground' : 'text-primary'}`}>+{count - 3}</span>}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</CardTitle>
                      <p className="text-xs text-muted-foreground">{dayLessons.length} {isAr ? 'دروس' : 'lessons'}</p>
                    </CardHeader>
                    <CardContent>
                      {dayLessons.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-8 text-center">{isAr ? 'لا توجد دروس في هذا اليوم' : 'No lessons on this day'}</p>
                      ) : (
                        <div className="space-y-2">
                          {dayLessons.map((lesson) => (
                            <div key={lesson.id} className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold">{format(new Date(lesson.scheduled_at), 'HH:mm')}</span>
                                <Badge variant={lesson.status === 'completed' ? 'secondary' : lesson.status === 'cancelled' ? 'destructive' : 'default'} className="text-[10px]">
                                  {t(`timetable.${lesson.status}`)}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{lesson.duration_minutes} {t('common.minutes')}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : null;

          case 'recentActivity':
            return widgets.recentActivity ? (
              <Card key={sectionKey}>
                <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" />{isAr ? 'النشاط الأخير' : 'Recent Activity'}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{isAr ? 'آخر تسجيل دخول: الآن' : 'Last login: Just now'}</p>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/dashboard/timetable')}>
                      <p className="text-lg font-bold">{stats.weeklyLessons}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? 'دروس الأسبوع' : 'Weekly Lessons'}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/dashboard/support')}>
                      <p className="text-lg font-bold">{stats.tickets}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? 'تذاكر مفتوحة' : 'Open Tickets'}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/dashboard/subscriptions')}>
                      <p className="text-lg font-bold">{stats.subscriptions}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? 'اشتراكات نشطة' : 'Active Subs'}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/dashboard/certificates')}>
                      <p className="text-lg font-bold">{stats.certificates}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? 'شهادات' : 'Certificates'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null;

          default:
            return null;
        }
      })}
    </div>
  );
};

export default Dashboard;
