import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { BookOpen, Users, GraduationCap, CreditCard, HeadphonesIcon, Calendar as CalendarIcon, DollarSign, AlertTriangle, Pencil, Award, ClipboardCheck, MessageSquare, UserCheck, Megaphone } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

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

// Individual widget keys - stats are now separate
type WidgetKey =
  | 'statCourses' | 'statStudents' | 'statTeachers' | 'statSubscriptions'
  | 'statTickets' | 'statLessons' | 'statWeeklyLessons' | 'statMri'
  | 'attendanceOverview' | 'certificatesIssued' | 'supportOverview'
  | 'teacherOverview' | 'announcementsWidget' | 'chatsOverview'
  | 'calendar' | 'upcomingLessons' | 'recentActivity'
  | 'recentSubscriptions' | 'topStudents';

const DEFAULT_WIDGETS: Record<WidgetKey, boolean> = {
  statCourses: true, statStudents: true, statTeachers: true, statSubscriptions: true,
  statTickets: true, statLessons: true, statWeeklyLessons: true, statMri: true,
  attendanceOverview: true, certificatesIssued: true, supportOverview: true,
  teacherOverview: true, announcementsWidget: true, chatsOverview: true,
  calendar: true, upcomingLessons: true, recentActivity: true,
  recentSubscriptions: true, topStudents: true,
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
};

interface WidgetCategory {
  label: string;
  labelAr: string;
  keys: WidgetKey[];
}

const WIDGET_CATEGORIES: WidgetCategory[] = [
  {
    label: '📊 Statistics Cards',
    labelAr: '📊 بطاقات الإحصائيات',
    keys: ['statCourses', 'statStudents', 'statTeachers', 'statSubscriptions', 'statTickets', 'statLessons', 'statWeeklyLessons', 'statMri'],
  },
  {
    label: '📋 Overview Cards',
    labelAr: '📋 بطاقات النظرة العامة',
    keys: ['attendanceOverview', 'certificatesIssued', 'supportOverview', 'teacherOverview', 'announcementsWidget', 'chatsOverview'],
  },
  {
    label: '📅 Schedule & Activity',
    labelAr: '📅 الجدول والنشاط',
    keys: ['calendar', 'upcomingLessons', 'recentActivity', 'recentSubscriptions', 'topStudents'],
  },
];

function migrateWidgets(saved: any): Record<WidgetKey, boolean> {
  const result = { ...DEFAULT_WIDGETS };
  if (saved) {
    // Migrate old 'stats' key to individual stat keys
    if ('stats' in saved) {
      const statsVal = saved.stats;
      (['statCourses', 'statStudents', 'statTeachers', 'statSubscriptions', 'statTickets', 'statLessons', 'statWeeklyLessons', 'statMri'] as WidgetKey[]).forEach(k => {
        result[k] = statsVal;
      });
    }
    // Migrate old 'quickActions' to 'chatsOverview'
    if ('quickActions' in saved) {
      result.chatsOverview = saved.quickActions;
    }
    // Apply any matching new keys
    for (const key of Object.keys(result) as WidgetKey[]) {
      if (key in saved) {
        result[key] = saved[key];
      }
    }
  }
  return result;
}

const Dashboard = () => {
  const { role, profile } = useAuth();
  const { t, language } = useLanguage();
  const { currency } = useAppSettings();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ courses: 0, students: 0, teachers: 0, subscriptions: 0, tickets: 0, lessons: 0, mri: 0, weeklyLessons: 0, teacherAbsences: 0, certificates: 0, attendance: 0, chats: 0, announcements: 0 });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [dayLessons, setDayLessons] = useState<TimetableEntry[]>([]);
  const [recentSubs, setRecentSubs] = useState<any[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [widgets, setWidgets] = useState<Record<WidgetKey, boolean>>(() => {
    const saved = localStorage.getItem('dashboard_widgets');
    return migrateWidgets(saved ? JSON.parse(saved) : null);
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

  useEffect(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const fetchStats = async () => {
      const [courses, students, teachers, subs, tickets, timetable, weeklyEntries, certs, attendanceCount, chatCount, announcementsCount] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('teachers').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id, price', { count: 'exact' }).eq('status', 'active'),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('timetable_entries').select('id', { count: 'exact', head: true }).gte('scheduled_at', now.toISOString()),
        supabase.from('timetable_entries').select('id, status')
          .gte('scheduled_at', weekStart.toISOString())
          .lte('scheduled_at', weekEnd.toISOString()),
        supabase.from('certificates').select('id', { count: 'exact', head: true }),
        supabase.from('attendance').select('id', { count: 'exact', head: true }),
        supabase.from('chats').select('id', { count: 'exact', head: true }),
        supabase.from('announcements').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      const mri = (subs.data || []).reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0);
      const weekData = weeklyEntries.data || [];
      const absences = weekData.filter((e: any) => e.status === 'cancelled').length;

      setStats({
        courses: courses.count || 0, students: students.count || 0, teachers: teachers.count || 0,
        subscriptions: subs.count || 0, tickets: tickets.count || 0, lessons: timetable.count || 0,
        mri, weeklyLessons: weekData.length, teacherAbsences: absences,
        certificates: certs.count || 0, attendance: attendanceCount.count || 0,
        chats: chatCount.count || 0, announcements: announcementsCount.count || 0,
      });
    };

    const fetchTimetable = async () => {
      const { data } = await supabase
        .from('timetable_entries')
        .select('id, scheduled_at, duration_minutes, status, course_id, teacher_id')
        .order('scheduled_at', { ascending: true });
      setTimetableEntries(data || []);
    };

    const fetchRecent = async () => {
      const { data: subsData } = await supabase.from('subscriptions').select('*, courses:course_id(title)').order('created_at', { ascending: false }).limit(5);
      setRecentSubs(subsData || []);
      const { data: annData } = await supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(3);
      setRecentAnnouncements(annData || []);
    };

    fetchStats();
    fetchTimetable();
    fetchRecent();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const filtered = timetableEntries.filter(e => isSameDay(new Date(e.scheduled_at), selectedDate));
      setDayLessons(filtered);
    }
  }, [selectedDate, timetableEntries]);

  const lessonDates = timetableEntries.map(e => new Date(e.scheduled_at));
  const hasLessonModifier = (date: Date) => lessonDates.some(d => isSameDay(d, date));
  const upcomingEntries = timetableEntries.filter(e => new Date(e.scheduled_at) >= new Date()).slice(0, 5);

  // Check if any stat in a group is visible
  const hasAnyStat = (['statCourses', 'statStudents', 'statTeachers', 'statSubscriptions', 'statTickets', 'statLessons', 'statWeeklyLessons', 'statMri'] as WidgetKey[]).some(k => widgets[k]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('dashboard.welcome')}, {profile?.full_name || 'User'}</h1>
        {isAdmin && (
          <Button
            variant={editMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditMode(!editMode)}
          >
            <Pencil className="h-4 w-4 me-1" />
            {editMode ? (isAr ? 'تم' : 'Done') : (isAr ? 'إدارة لوحة التحكم' : 'Manage Dashboard')}
          </Button>
        )}
      </div>

      {/* Edit Mode Panel - Categorized */}
      {editMode && isAdmin && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 space-y-4">
            {WIDGET_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <p className="text-sm font-semibold mb-2 text-primary">
                  {isAr ? cat.labelAr : cat.label}
                </p>
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

      {/* Admin Statistics */}
      {role === 'admin' && hasAnyStat && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {widgets.statCourses && <StatCard title={t('dashboard.totalCourses')} value={stats.courses} icon={BookOpen} onClick={() => navigate('/dashboard/courses')} />}
          {widgets.statStudents && <StatCard title={t('dashboard.totalStudents')} value={stats.students} icon={GraduationCap} onClick={() => navigate('/dashboard/students')} />}
          {widgets.statTeachers && <StatCard title={t('dashboard.totalTeachers')} value={stats.teachers} icon={Users} onClick={() => navigate('/dashboard/teachers')} />}
          {widgets.statSubscriptions && <StatCard title={t('dashboard.activeSubscriptions')} value={stats.subscriptions} icon={CreditCard} onClick={() => navigate('/dashboard/subscriptions')} />}
          {widgets.statTickets && <StatCard title={t('dashboard.openTickets')} value={stats.tickets} icon={HeadphonesIcon} onClick={() => navigate('/dashboard/support')} />}
          {widgets.statLessons && <StatCard title={t('dashboard.upcomingLessons')} value={stats.lessons} icon={CalendarIcon} onClick={() => navigate('/dashboard/timetable')} />}
          {widgets.statWeeklyLessons && <StatCard title={isAr ? 'دروس هذا الأسبوع' : 'Lessons This Week'} value={stats.weeklyLessons} icon={CalendarIcon} onClick={() => navigate('/dashboard/timetable')} />}
          {widgets.statMri && <StatCard title={isAr ? 'الدخل الشهري المتكرر' : 'Monthly Recurring Income'} value={`${currency.symbol}${stats.mri.toFixed(2)}`} icon={DollarSign} onClick={() => navigate('/dashboard/reports')} />}
          {stats.teacherAbsences > 0 && (
            <StatCard title={isAr ? 'غيابات المعلمين' : 'Teacher Absences'} value={stats.teacherAbsences} icon={AlertTriangle} alert onClick={() => navigate('/dashboard/attendance')} />
          )}
        </div>
      )}

      {/* Teacher Stats */}
      {role === 'teacher' && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title={t('dashboard.myStudents')} value={stats.students} icon={GraduationCap} onClick={() => navigate('/dashboard/students')} />
          <StatCard title={t('dashboard.myCourses')} value={stats.courses} icon={BookOpen} onClick={() => navigate('/dashboard/courses')} />
          <StatCard title={t('dashboard.upcomingLessons')} value={stats.lessons} icon={CalendarIcon} onClick={() => navigate('/dashboard/timetable')} />
        </div>
      )}

      {/* Student Stats */}
      {role === 'student' && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title={t('dashboard.myCourses')} value={stats.courses} icon={BookOpen} onClick={() => navigate('/dashboard/courses')} />
          <StatCard title={t('dashboard.mySchedule')} value={stats.lessons} icon={CalendarIcon} onClick={() => navigate('/dashboard/timetable')} />
          <StatCard title={t('dashboard.activeSubscriptions')} value={stats.subscriptions} icon={CreditCard} onClick={() => navigate('/dashboard/subscriptions')} />
        </div>
      )}

      {/* Overview Cards */}
      {isAdmin && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {widgets.attendanceOverview && (
            <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dashboard/attendance')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  {isAr ? 'الحضور' : 'Attendance'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.attendance}</div>
                <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي السجلات' : 'Total Records'}</p>
              </CardContent>
            </Card>
          )}
          {widgets.certificatesIssued && (
            <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dashboard/certificates')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  {isAr ? 'الشهادات' : 'Certificates'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.certificates}</div>
                <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي الشهادات' : 'Total Certificates'}</p>
              </CardContent>
            </Card>
          )}
          {widgets.supportOverview && (
            <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dashboard/support')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <HeadphonesIcon className="h-4 w-4 text-primary" />
                  {isAr ? 'الدعم' : 'Support'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.tickets}</div>
                <p className="text-xs text-muted-foreground">{isAr ? 'تذاكر مفتوحة' : 'Open Tickets'}</p>
              </CardContent>
            </Card>
          )}
          {widgets.teacherOverview && (
            <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dashboard/teachers')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  {isAr ? 'المعلمون' : 'Teachers'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.teachers}</div>
                <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي المعلمين' : 'Total Teachers'}</p>
              </CardContent>
            </Card>
          )}
          {widgets.announcementsWidget && (
            <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dashboard/announcements')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-primary" />
                  {isAr ? 'الإعلانات' : 'Announcements'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.announcements}</div>
                <p className="text-xs text-muted-foreground">{isAr ? 'إعلانات نشطة' : 'Active'}</p>
              </CardContent>
            </Card>
          )}
          {widgets.chatsOverview && (
            <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dashboard/chats')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  {isAr ? 'المحادثات' : 'Chats'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.chats}</div>
                <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي المحادثات' : 'Total Chats'}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Upcoming Lessons Widget */}
      {widgets.upcomingLessons && upcomingEntries.length > 0 && (
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dashboard/timetable')}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              {isAr ? 'الدروس القادمة' : 'Upcoming Lessons'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingEntries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium">{format(new Date(entry.scheduled_at), 'EEE, MMM d')}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(entry.scheduled_at), 'HH:mm')} · {entry.duration_minutes} {t('common.minutes')}</p>
                  </div>
                  <Badge variant={entry.status === 'cancelled' ? 'destructive' : 'outline'} className="text-[10px]">{entry.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Subscriptions Widget */}
      {widgets.recentSubscriptions && isAdmin && recentSubs.length > 0 && (
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dashboard/subscriptions')}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              {isAr ? 'أحدث الاشتراكات' : 'Recent Subscriptions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSubs.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-2 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium">{(sub.courses as any)?.title || '—'}</p>
                    <p className="text-xs text-muted-foreground">{sub.subscription_type} · {currency.symbol}{Number(sub.price || 0).toFixed(0)}</p>
                  </div>
                  <Badge variant={sub.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{sub.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lessons Calendar */}
      {widgets.calendar && (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {isAr ? 'تقويم الدروس' : 'Lessons Calendar'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{ hasLesson: hasLessonModifier }}
                modifiersClassNames={{ hasLesson: 'bg-primary/20 text-primary font-bold ring-2 ring-primary/30' }}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-lg">
              <CardTitle>
                {selectedDate
                  ? `${isAr ? 'دروس يوم' : 'Lessons on'} ${format(selectedDate, 'PPP')}`
                  : isAr ? 'اختر يوماً' : 'Select a day'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {dayLessons.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {isAr ? 'لا توجد دروس في هذا اليوم' : 'No lessons on this day'}
                </p>
              ) : (
                <div className="space-y-3">
                  {dayLessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{format(new Date(lesson.scheduled_at), 'HH:mm')}</p>
                        <p className="text-xs text-muted-foreground">{lesson.duration_minutes} {t('common.minutes')}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        lesson.status === 'completed' ? 'bg-primary/10 text-primary' :
                        lesson.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                        'bg-accent/20 text-accent-foreground'
                      }`}>
                        {t(`timetable.${lesson.status}`)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      {widgets.recentActivity && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              {isAr ? 'النشاط الأخير' : 'Recent Activity'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isAr ? 'آخر تسجيل دخول: الآن' : 'Last login: Just now'}
            </p>
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
      )}
    </div>
  );
};

export default Dashboard;