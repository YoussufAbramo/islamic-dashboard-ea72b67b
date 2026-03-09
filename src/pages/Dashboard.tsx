import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { BookOpen, Users, GraduationCap, CreditCard, HeadphonesIcon, Calendar as CalendarIcon, DollarSign, AlertTriangle, Pencil, Award, ClipboardCheck, MessageSquare, TrendingUp, UserCheck } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, alert }: { title: string; value: number | string; icon: any; alert?: boolean }) => (
  <Card className={`hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200 cursor-pointer hover:border-primary/40 hover:shadow-primary/10 ${alert ? 'border-destructive/50' : ''}`}>
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

type WidgetKey = 'stats' | 'calendar' | 'recentActivity' | 'quickActions' | 'attendanceOverview' | 'certificatesIssued';

const DEFAULT_WIDGETS: Record<WidgetKey, boolean> = {
  stats: true,
  calendar: true,
  recentActivity: true,
  quickActions: true,
  attendanceOverview: true,
  certificatesIssued: true,
};

const WIDGET_LABELS: Record<WidgetKey, { en: string; ar: string }> = {
  stats: { en: 'Statistics Cards', ar: 'بطاقات الإحصائيات' },
  calendar: { en: 'Lessons Calendar', ar: 'تقويم الدروس' },
  recentActivity: { en: 'Recent Activity', ar: 'النشاط الأخير' },
  quickActions: { en: 'Quick Actions', ar: 'إجراءات سريعة' },
  attendanceOverview: { en: 'Attendance Overview', ar: 'نظرة عامة على الحضور' },
  certificatesIssued: { en: 'Certificates Issued', ar: 'الشهادات الصادرة' },
};

const Dashboard = () => {
  const { role, profile } = useAuth();
  const { t, language } = useLanguage();
  const { currency } = useAppSettings();
  const [stats, setStats] = useState({ courses: 0, students: 0, teachers: 0, subscriptions: 0, tickets: 0, lessons: 0, mri: 0, weeklyLessons: 0, teacherAbsences: 0, certificates: 0, attendance: 0, chats: 0 });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [dayLessons, setDayLessons] = useState<TimetableEntry[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [widgets, setWidgets] = useState<Record<WidgetKey, boolean>>(() => {
    const saved = localStorage.getItem('dashboard_widgets');
    return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
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
      const [courses, students, teachers, subs, tickets, timetable, weeklyEntries, certs, attendanceCount, chatCount] = await Promise.all([
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
      ]);

      const mri = (subs.data || []).reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0);
      const weekData = weeklyEntries.data || [];
      const absences = weekData.filter((e: any) => e.status === 'cancelled').length;

      setStats({
        courses: courses.count || 0,
        students: students.count || 0,
        teachers: teachers.count || 0,
        subscriptions: subs.count || 0,
        tickets: tickets.count || 0,
        lessons: timetable.count || 0,
        mri,
        weeklyLessons: weekData.length,
        teacherAbsences: absences,
        certificates: certs.count || 0,
        attendance: attendanceCount.count || 0,
        chats: chatCount.count || 0,
      });
    };

    const fetchTimetable = async () => {
      const { data } = await supabase
        .from('timetable_entries')
        .select('id, scheduled_at, duration_minutes, status, course_id, teacher_id')
        .order('scheduled_at', { ascending: true });
      setTimetableEntries(data || []);
    };

    fetchStats();
    fetchTimetable();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const filtered = timetableEntries.filter(e => isSameDay(new Date(e.scheduled_at), selectedDate));
      setDayLessons(filtered);
    }
  }, [selectedDate, timetableEntries]);

  const lessonDates = timetableEntries.map(e => new Date(e.scheduled_at));
  const hasLessonModifier = (date: Date) => lessonDates.some(d => isSameDay(d, date));

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
            {editMode ? (isAr ? 'تم' : 'Done') : (isAr ? 'تعديل' : 'Edit Mode')}
          </Button>
        )}
      </div>

      {/* Edit Mode Panel */}
      {editMode && isAdmin && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <p className="text-sm font-medium mb-3">{isAr ? 'إظهار/إخفاء الأدوات' : 'Show/Hide Widgets'}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(Object.keys(WIDGET_LABELS) as WidgetKey[]).map((key) => (
                <div key={key} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border">
                  <span className="text-xs">{isAr ? WIDGET_LABELS[key].ar : WIDGET_LABELS[key].en}</span>
                  <Switch checked={widgets[key]} onCheckedChange={() => toggleWidget(key)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {widgets.stats && (
        <>
          {role === 'admin' && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <StatCard title={t('dashboard.totalCourses')} value={stats.courses} icon={BookOpen} />
              <StatCard title={t('dashboard.totalStudents')} value={stats.students} icon={GraduationCap} />
              <StatCard title={t('dashboard.totalTeachers')} value={stats.teachers} icon={Users} />
              <StatCard title={t('dashboard.activeSubscriptions')} value={stats.subscriptions} icon={CreditCard} />
              <StatCard title={t('dashboard.openTickets')} value={stats.tickets} icon={HeadphonesIcon} />
              <StatCard title={t('dashboard.upcomingLessons')} value={stats.lessons} icon={CalendarIcon} />
              <StatCard
                title={isAr ? 'دروس هذا الأسبوع' : 'Lessons This Week'}
                value={stats.weeklyLessons}
                icon={CalendarIcon}
              />
              <StatCard
                title={isAr ? 'الدخل الشهري المتكرر' : 'Monthly Recurring Income'}
                value={`${currency.symbol}${stats.mri.toFixed(2)}`}
                icon={DollarSign}
              />
              {stats.teacherAbsences > 0 && (
                <StatCard
                  title={isAr ? 'غيابات المعلمين (هذا الأسبوع)' : 'Teacher Absences (This Week)'}
                  value={stats.teacherAbsences}
                  icon={AlertTriangle}
                  alert
                />
              )}
            </div>
          )}
          {role === 'teacher' && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard title={t('dashboard.myStudents')} value={stats.students} icon={GraduationCap} />
              <StatCard title={t('dashboard.myCourses')} value={stats.courses} icon={BookOpen} />
              <StatCard title={t('dashboard.upcomingLessons')} value={stats.lessons} icon={CalendarIcon} />
              <StatCard title={isAr ? 'دروس هذا الأسبوع' : 'Lessons This Week'} value={stats.weeklyLessons} icon={CalendarIcon} />
            </div>
          )}
          {role === 'student' && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard title={t('dashboard.myCourses')} value={stats.courses} icon={BookOpen} />
              <StatCard title={t('dashboard.mySchedule')} value={stats.lessons} icon={CalendarIcon} />
              <StatCard title={t('dashboard.activeSubscriptions')} value={stats.subscriptions} icon={CreditCard} />
              <StatCard title={isAr ? 'دروس هذا الأسبوع' : 'Lessons This Week'} value={stats.weeklyLessons} icon={CalendarIcon} />
            </div>
          )}
        </>
      )}

      {/* Additional Widgets Row */}
      {(widgets.attendanceOverview || widgets.certificatesIssued || widgets.quickActions) && isAdmin && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {widgets.attendanceOverview && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  {isAr ? 'نظرة عامة على الحضور' : 'Attendance Overview'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.attendance}</div>
                <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي السجلات' : 'Total Records'}</p>
              </CardContent>
            </Card>
          )}
          {widgets.certificatesIssued && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  {isAr ? 'الشهادات الصادرة' : 'Certificates Issued'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.certificates}</div>
                <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي الشهادات' : 'Total Certificates'}</p>
              </CardContent>
            </Card>
          )}
          {widgets.quickActions && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{isAr ? 'المحادثات النشطة' : 'Active Chats'}</span>
                  <Badge variant="outline">{stats.chats}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{isAr ? 'الدورات' : 'Courses'}</span>
                  <Badge variant="outline">{stats.courses}</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Lessons Calendar */}
      {widgets.calendar && (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-gold" />
                {isAr ? 'تقويم الدروس' : 'Lessons Calendar'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{ hasLesson: hasLessonModifier }}
                modifiersClassNames={{ hasLesson: 'bg-primary/20 text-primary font-bold' }}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate
                  ? `${isAr ? 'دروس يوم' : 'Lessons on'} ${format(selectedDate, 'PPP')}`
                  : isAr ? 'اختر يوماً' : 'Select a day'}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                      <div className="flex items-center gap-2">
                        {lesson.status === 'cancelled' && (
                          <Badge variant="destructive" className="text-[10px]">
                            <AlertTriangle className="h-3 w-3 me-1" />
                            {isAr ? 'غياب' : 'Absent'}
                          </Badge>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          lesson.status === 'completed' ? 'bg-primary/10 text-primary' :
                          lesson.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                          'bg-accent/20 text-accent-foreground'
                        }`}>
                          {t(`timetable.${lesson.status}`)}
                        </span>
                      </div>
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
              <div className="text-center p-3 rounded-lg border border-border">
                <p className="text-lg font-bold">{stats.weeklyLessons}</p>
                <p className="text-xs text-muted-foreground">{isAr ? 'دروس الأسبوع' : 'Weekly Lessons'}</p>
              </div>
              <div className="text-center p-3 rounded-lg border border-border">
                <p className="text-lg font-bold">{stats.tickets}</p>
                <p className="text-xs text-muted-foreground">{isAr ? 'تذاكر مفتوحة' : 'Open Tickets'}</p>
              </div>
              <div className="text-center p-3 rounded-lg border border-border">
                <p className="text-lg font-bold">{stats.subscriptions}</p>
                <p className="text-xs text-muted-foreground">{isAr ? 'اشتراكات نشطة' : 'Active Subs'}</p>
              </div>
              <div className="text-center p-3 rounded-lg border border-border">
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
