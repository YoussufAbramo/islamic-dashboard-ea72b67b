import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { BookOpen, Users, GraduationCap, CreditCard, HeadphonesIcon, Calendar as CalendarIcon, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, isSameDay } from 'date-fns';

const StatCard = ({ title, value, icon: Icon }: { title: string; value: number | string; icon: any }) => (
  <Card className="hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200 cursor-pointer hover:border-[hsl(var(--gold))]/40 hover:shadow-[0_4px_20px_hsl(var(--gold)/0.15)]">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

interface TimetableEntry {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  course_id: string | null;
}

const Dashboard = () => {
  const { role, profile } = useAuth();
  const { t, language } = useLanguage();
  const [stats, setStats] = useState({ courses: 0, students: 0, teachers: 0, subscriptions: 0, tickets: 0, lessons: 0, mri: 0 });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [dayLessons, setDayLessons] = useState<TimetableEntry[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [courses, students, teachers, subs, tickets, timetable] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('teachers').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id, price', { count: 'exact' }).eq('status', 'active'),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('timetable_entries').select('id', { count: 'exact', head: true }).gte('scheduled_at', new Date().toISOString()),
      ]);

      // Calculate MRI from active subscriptions
      const mri = (subs.data || []).reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0);

      setStats({
        courses: courses.count || 0,
        students: students.count || 0,
        teachers: teachers.count || 0,
        subscriptions: subs.count || 0,
        tickets: tickets.count || 0,
        lessons: timetable.count || 0,
        mri,
      });
    };

    const fetchTimetable = async () => {
      const { data } = await supabase
        .from('timetable_entries')
        .select('id, scheduled_at, duration_minutes, status, course_id')
        .order('scheduled_at', { ascending: true });
      setTimetableEntries(data || []);
    };

    fetchStats();
    fetchTimetable();
  }, []);

  // Filter lessons for selected day
  useEffect(() => {
    if (selectedDate) {
      const filtered = timetableEntries.filter(e => isSameDay(new Date(e.scheduled_at), selectedDate));
      setDayLessons(filtered);
    }
  }, [selectedDate, timetableEntries]);

  // Days that have lessons (for calendar highlighting)
  const lessonDates = timetableEntries.map(e => new Date(e.scheduled_at));
  const hasLessonModifier = (date: Date) => lessonDates.some(d => isSameDay(d, date));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('dashboard.welcome')}, {profile?.full_name || 'User'}</h1>

      {role === 'admin' && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard title={t('dashboard.totalCourses')} value={stats.courses} icon={BookOpen} />
          <StatCard title={t('dashboard.totalStudents')} value={stats.students} icon={GraduationCap} />
          <StatCard title={t('dashboard.totalTeachers')} value={stats.teachers} icon={Users} />
          <StatCard title={t('dashboard.activeSubscriptions')} value={stats.subscriptions} icon={CreditCard} />
          <StatCard title={t('dashboard.openTickets')} value={stats.tickets} icon={HeadphonesIcon} />
          <StatCard title={t('dashboard.upcomingLessons')} value={stats.lessons} icon={CalendarIcon} />
          <StatCard title={language === 'ar' ? 'الدخل الشهري المتكرر' : 'Monthly Recurring Income'} value={`$${stats.mri.toFixed(2)}`} icon={DollarSign} />
        </div>
      )}

      {role === 'teacher' && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title={t('dashboard.myStudents')} value={stats.students} icon={GraduationCap} />
          <StatCard title={t('dashboard.myCourses')} value={stats.courses} icon={BookOpen} />
          <StatCard title={t('dashboard.upcomingLessons')} value={stats.lessons} icon={CalendarIcon} />
        </div>
      )}

      {role === 'student' && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title={t('dashboard.myCourses')} value={stats.courses} icon={BookOpen} />
          <StatCard title={t('dashboard.mySchedule')} value={stats.lessons} icon={CalendarIcon} />
          <StatCard title={t('dashboard.activeSubscriptions')} value={stats.subscriptions} icon={CreditCard} />
        </div>
      )}

      {/* Lessons Calendar */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gold" />
              {language === 'ar' ? 'تقويم الدروس' : 'Lessons Calendar'}
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
                ? `${language === 'ar' ? 'دروس يوم' : 'Lessons on'} ${format(selectedDate, 'PPP')}`
                : language === 'ar' ? 'اختر يوماً' : 'Select a day'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dayLessons.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {language === 'ar' ? 'لا توجد دروس في هذا اليوم' : 'No lessons on this day'}
              </p>
            ) : (
              <div className="space-y-3">
                {dayLessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(lesson.scheduled_at), 'HH:mm')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lesson.duration_minutes} {t('common.minutes')}
                      </p>
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
    </div>
  );
};

export default Dashboard;
