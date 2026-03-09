import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, GraduationCap, CreditCard, HeadphonesIcon, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const StatCard = ({ title, value, icon: Icon }: { title: string; value: number | string; icon: any }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { role, profile } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({ courses: 0, students: 0, teachers: 0, subscriptions: 0, tickets: 0, lessons: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [courses, students, teachers, subs, tickets, timetable] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('teachers').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('timetable_entries').select('id', { count: 'exact', head: true }).gte('scheduled_at', new Date().toISOString()),
      ]);
      setStats({
        courses: courses.count || 0,
        students: students.count || 0,
        teachers: teachers.count || 0,
        subscriptions: subs.count || 0,
        tickets: tickets.count || 0,
        lessons: timetable.count || 0,
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('dashboard.welcome')}, {profile?.full_name || 'User'}</h1>

      {role === 'admin' && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard title={t('dashboard.totalCourses')} value={stats.courses} icon={BookOpen} />
          <StatCard title={t('dashboard.totalStudents')} value={stats.students} icon={GraduationCap} />
          <StatCard title={t('dashboard.totalTeachers')} value={stats.teachers} icon={Users} />
          <StatCard title={t('dashboard.activeSubscriptions')} value={stats.subscriptions} icon={CreditCard} />
          <StatCard title={t('dashboard.openTickets')} value={stats.tickets} icon={HeadphonesIcon} />
          <StatCard title={t('dashboard.upcomingLessons')} value={stats.lessons} icon={Calendar} />
        </div>
      )}

      {role === 'teacher' && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title={t('dashboard.myStudents')} value={stats.students} icon={GraduationCap} />
          <StatCard title={t('dashboard.myCourses')} value={stats.courses} icon={BookOpen} />
          <StatCard title={t('dashboard.upcomingLessons')} value={stats.lessons} icon={Calendar} />
        </div>
      )}

      {role === 'student' && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title={t('dashboard.myCourses')} value={stats.courses} icon={BookOpen} />
          <StatCard title={t('dashboard.mySchedule')} value={stats.lessons} icon={Calendar} />
          <StatCard title={t('dashboard.activeSubscriptions')} value={stats.subscriptions} icon={CreditCard} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
