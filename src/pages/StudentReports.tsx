import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { GraduationCap, Users, CreditCard, UserX, TrendingUp, AlertTriangle, Eye, CheckCircle, XCircle, Clock, FileText, CalendarDays } from 'lucide-react';
import { TableSkeleton } from '@/components/PageSkeleton';
import EmptyState from '@/components/EmptyState';
import { format } from 'date-fns';
import { getLabel, timetableStatusLabels } from '@/lib/statusLabels';
import { ACTION_BTN, ACTION_ICON } from '@/lib/actionBtnClass';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface StudentRow {
  id: string;
  user_id: string;
  profile: { full_name: string; email: string | null };
}

interface SubRow {
  id: string;
  student_id: string;
  course_id: string;
  status: string;
  start_date: string;
  renewal_date: string | null;
  auto_renew: boolean;
  course_title: string;
  teacher_name: string;
}

interface TimetableRow {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  student_id: string | null;
  course_id: string | null;
  teacher_id: string | null;
}

interface SessionReport {
  id: string;
  timetable_entry_id: string;
  summary: string;
  observations: string | null;
  performance_remarks: string | null;
  session_duration_seconds: number;
  started_at: string;
  ended_at: string;
  course_id: string | null;
  teacher_id: string | null;
}

const StudentReports = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubRow[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableRow[]>([]);
  const [sessionReports, setSessionReports] = useState<SessionReport[]>([]);
  const [historyStudent, setHistoryStudent] = useState<StudentRow | null>(null);
  const [lessonReportEntry, setLessonReportEntry] = useState<TimetableRow | null>(null);
  const [monthlyReportStudent, setMonthlyReportStudent] = useState<StudentRow | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [studentsRes, subsRes, entriesRes, reportsRes] = await Promise.all([
        supabase.from('students').select('id, user_id, profiles:user_id(full_name, email)'),
        supabase.from('subscriptions').select('id, student_id, course_id, status, start_date, renewal_date, auto_renew, courses:course_id(title), teachers:teacher_id(profiles:user_id(full_name))'),
        supabase.from('timetable_entries').select('id, scheduled_at, duration_minutes, status, student_id, course_id, teacher_id').order('scheduled_at', { ascending: false }),
        supabase.from('session_reports').select('id, timetable_entry_id, summary, observations, performance_remarks, session_duration_seconds, started_at, ended_at, course_id, teacher_id'),
      ]);

      if (studentsRes.data) {
        setStudents(studentsRes.data.map((s: any) => ({
          id: s.id,
          user_id: s.user_id,
          profile: { full_name: s.profiles?.full_name || '', email: s.profiles?.email || '' },
        })));
      }

      if (subsRes.data) {
        setSubscriptions(subsRes.data.map((s: any) => ({
          id: s.id,
          student_id: s.student_id,
          course_id: s.course_id,
          status: s.status,
          start_date: s.start_date,
          renewal_date: s.renewal_date,
          auto_renew: s.auto_renew,
          course_title: s.courses?.title || '-',
          teacher_name: s.teachers?.profiles?.full_name || '-',
        })));
      }

      if (entriesRes.data) setTimetableEntries(entriesRes.data as TimetableRow[]);
      if (reportsRes.data) setSessionReports(reportsRes.data as SessionReport[]);

      setLoading(false);
    };
    fetchData();
  }, []);

  // ── Computed Stats ──
  const subscribedStudentIds = useMemo(() => {
    const ids = new Set<string>();
    subscriptions.filter(s => s.status === 'active').forEach(s => ids.add(s.student_id));
    return ids;
  }, [subscriptions]);

  const subscribedCount = subscribedStudentIds.size;
  const nonSubscribedCount = students.length - subscribedCount;

  const expiredSubs = useMemo(() => subscriptions.filter(s => s.status === 'expired'), [subscriptions]);
  const notRenewedStudents = useMemo(() => {
    const ids = new Set<string>();
    expiredSubs.forEach(s => {
      if (!subscriptions.some(sub => sub.student_id === s.student_id && sub.status === 'active')) {
        ids.add(s.student_id);
      }
    });
    return ids;
  }, [expiredSubs, subscriptions]);

  const activeSubs = useMemo(() => subscriptions.filter(s => s.status === 'active'), [subscriptions]);
  const avgLessonsPerStudent = useMemo(() => {
    if (subscribedCount === 0) return 0;
    const lessons = timetableEntries.filter(e => e.student_id && subscribedStudentIds.has(e.student_id));
    return Math.round(lessons.length / subscribedCount);
  }, [timetableEntries, subscribedStudentIds, subscribedCount]);

  // ── Attendance Performance Chart ──
  const attendanceChartData = useMemo(() => {
    const studentMap = new Map<string, { name: string; attended: number; total: number }>();

    students.forEach(s => {
      studentMap.set(s.id, { name: s.profile.full_name, attended: 0, total: 0 });
    });

    timetableEntries.forEach(entry => {
      if (!entry.student_id || !studentMap.has(entry.student_id)) return;
      const rec = studentMap.get(entry.student_id)!;
      if (['completed', 'scheduled', 'in_progress'].includes(entry.status) || entry.status.includes('not_attend') || entry.status === 'cancelled' || entry.status === 'postponed') {
        rec.total++;
        if (entry.status === 'completed') rec.attended++;
      }
    });

    return Array.from(studentMap.values())
      .filter(s => s.total > 0)
      .map(s => ({
        name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name,
        fullName: s.name,
        percentage: Math.round((s.attended / s.total) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 15);
  }, [students, timetableEntries]);

  // ── Not Renewed Pie Chart ──
  const renewalPieData = useMemo(() => [
    { name: isAr ? 'مشترك نشط' : 'Active', value: subscribedCount },
    { name: isAr ? 'غير مجدد' : 'Not Renewed', value: notRenewedStudents.size },
    { name: isAr ? 'بدون اشتراك' : 'Never Subscribed', value: Math.max(0, students.length - subscribedCount - notRenewedStudents.size) },
  ].filter(d => d.value > 0), [subscribedCount, notRenewedStudents, students]);

  // ── Subscriptions by status ──
  const subsByStatus = useMemo(() => {
    const map: Record<string, SubRow[]> = { active: [], expired: [], cancelled: [] };
    subscriptions.forEach(s => {
      if (map[s.status]) map[s.status].push(s);
      else {
        map[s.status] = map[s.status] || [];
        map[s.status].push(s);
      }
    });
    return map;
  }, [subscriptions]);

  // ── Student lesson history ──
  const studentLessons = useMemo(() => {
    if (!historyStudent) return [];
    return timetableEntries.filter(e => e.student_id === historyStudent.id);
  }, [historyStudent, timetableEntries]);

  const getEntryReport = (entryId: string) => sessionReports.find(r => r.timetable_entry_id === entryId);

  const getStudentName = (studentId: string) => {
    const s = students.find(st => st.id === studentId);
    return s?.profile.full_name || '-';
  };

  const isNotAttend = (status: string) =>
    status === 'not_attend' || status === 'teacher_not_attend' || status === 'student_not_attend';

  const getStatusBadge = (status: string) => {
    if (status === 'completed') return <Badge variant="default" className="bg-emerald-600">{isAr ? 'انتهى' : 'Attended'}</Badge>;
    if (isNotAttend(status)) return <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-600">{isAr ? 'غياب' : 'Absence'}</Badge>;
    if (status === 'cancelled') return <Badge variant="destructive">{isAr ? 'ملغي' : 'Cancelled'}</Badge>;
    if (status === 'postponed') return <Badge variant="secondary">{isAr ? 'مؤجل' : 'Postponed'}</Badge>;
    if (status === 'scheduled') return <Badge variant="outline">{isAr ? 'قادم' : 'Upcoming'}</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  const subscribedStudents = useMemo(() =>
    students.filter(s => subscribedStudentIds.has(s.id)),
  [students, subscribedStudentIds]);

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{isAr ? 'تقارير الطلاب' : 'Students Reports'}</h1>

      {/* ── Stats Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'إجمالي الطلاب' : 'Total Students'}</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'طلاب مشتركون' : 'Subscribed Students'}</p>
                <p className="text-2xl font-bold">{subscribedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <UserX className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'غير مشتركين' : 'Non-Subscribed'}</p>
                <p className="text-2xl font-bold">{nonSubscribedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? 'متوسط الدروس لكل طالب' : 'Avg Lessons/Student'}</p>
                <p className="text-2xl font-bold">{avgLessonsPerStudent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? 'أداء حضور الطلاب (%)' : 'Student Attendance Performance (%)'}</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceChartData.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">{isAr ? 'لا توجد بيانات' : 'No data yet'}</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, isAr ? 'نسبة الحضور' : 'Attendance']}
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                  />
                  <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? 'حالة اشتراكات الطلاب' : 'Student Subscription Status'}</CardTitle>
          </CardHeader>
          <CardContent>
            {renewalPieData.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">{isAr ? 'لا توجد بيانات' : 'No data yet'}</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={renewalPieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {renewalPieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="subscriptions">
        <TabsList>
          <TabsTrigger value="subscriptions">{isAr ? 'الاشتراكات' : 'Subscriptions'}</TabsTrigger>
          <TabsTrigger value="lesson-reports">{isAr ? 'تقارير الدروس' : 'Lesson Reports'}</TabsTrigger>
        </TabsList>

        {/* ── Subscriptions Tab ── */}
        <TabsContent value="subscriptions" className="space-y-4 mt-4">
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active" className="gap-1.5">
                {isAr ? 'نشط' : 'Active'}
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{subsByStatus.active?.length || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="expired" className="gap-1.5">
                {isAr ? 'منتهي' : 'Expired'}
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{subsByStatus.expired?.length || 0}</Badge>
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="gap-1.5">
                {isAr ? 'ملغي' : 'Cancelled'}
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{subsByStatus.cancelled?.length || 0}</Badge>
              </TabsTrigger>
            </TabsList>

            {(['active', 'expired', 'cancelled'] as const).map(status => (
              <TabsContent key={status} value={status} className="mt-3">
                {(subsByStatus[status]?.length || 0) === 0 ? (
                  <EmptyState icon={CreditCard} title={isAr ? 'لا توجد اشتراكات' : 'No subscriptions'} description={isAr ? 'لا توجد اشتراكات بهذه الحالة' : `No ${status} subscriptions found`} />
                ) : (
                  <div className="border rounded-lg overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{isAr ? 'الطالب' : 'Student'}</TableHead>
                          <TableHead>{isAr ? 'الدورة' : 'Course'}</TableHead>
                          <TableHead>{isAr ? 'المعلم' : 'Teacher'}</TableHead>
                          <TableHead>{isAr ? 'تاريخ البدء' : 'Start Date'}</TableHead>
                          <TableHead>{isAr ? 'تاريخ التجديد' : 'Renewal Date'}</TableHead>
                          <TableHead>{isAr ? 'تجديد تلقائي' : 'Auto Renew'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subsByStatus[status]?.map(sub => (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium">{getStudentName(sub.student_id)}</TableCell>
                            <TableCell>{sub.course_title}</TableCell>
                            <TableCell>{sub.teacher_name}</TableCell>
                            <TableCell>{format(new Date(sub.start_date), 'yyyy-MM-dd')}</TableCell>
                            <TableCell>{sub.renewal_date ? format(new Date(sub.renewal_date), 'yyyy-MM-dd') : '-'}</TableCell>
                            <TableCell>
                              {sub.auto_renew
                                ? <Badge variant="default" className="bg-emerald-600">{isAr ? 'نعم' : 'Yes'}</Badge>
                                : <Badge variant="outline">{isAr ? 'لا' : 'No'}</Badge>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        {/* ── Lesson Reports Tab ── */}
        <TabsContent value="lesson-reports" className="mt-4">
          {subscribedStudents.length === 0 ? (
            <EmptyState icon={GraduationCap} title={isAr ? 'لا يوجد طلاب مشتركون' : 'No subscribed students'} description={isAr ? 'لم يتم العثور على طلاب لديهم اشتراكات نشطة' : 'No students with active subscriptions found'} />
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? 'الطالب' : 'Student'}</TableHead>
                    <TableHead>{isAr ? 'الدروس المكتملة' : 'Attended'}</TableHead>
                    <TableHead>{isAr ? 'غياب' : 'Absent'}</TableHead>
                    <TableHead>{isAr ? 'نسبة الحضور' : 'Rate'}</TableHead>
                    <TableHead className="text-end">{isAr ? 'إجراء' : 'Action'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribedStudents.map(student => {
                    const lessons = timetableEntries.filter(e => e.student_id === student.id);
                    const attended = lessons.filter(e => e.status === 'completed').length;
                    const absent = lessons.filter(e => isNotAttend(e.status)).length;
                    const total = attended + absent;
                    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.profile.full_name}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="h-3.5 w-3.5" />{attended}</span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-rose-600"><XCircle className="h-3.5 w-3.5" />{absent}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={rate >= 80 ? 'border-emerald-500/40 text-emerald-600' : rate >= 50 ? 'border-amber-500/40 text-amber-600' : 'border-rose-500/40 text-rose-600'}>
                            {rate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end">
                          <div className="flex items-center justify-end gap-1">
                            <Button className={ACTION_BTN} variant="ghost" size="icon" title={isAr ? 'التقرير الشهري' : 'Monthly Report'} onClick={() => { setMonthlyReportStudent(student); setSelectedMonth(format(new Date(), 'yyyy-MM')); }}>
                              <CalendarDays className={ACTION_ICON} />
                            </Button>
                            <Button className={ACTION_BTN} variant="ghost" size="icon" title={isAr ? 'السجل' : 'History'} onClick={() => setHistoryStudent(student)}>
                              <Eye className={ACTION_ICON} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Lesson History Dialog ── */}
      <Dialog open={!!historyStudent} onOpenChange={() => { setHistoryStudent(null); setLessonReportEntry(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {isAr ? `سجل دروس — ${historyStudent?.profile.full_name}` : `Lesson History — ${historyStudent?.profile.full_name}`}
            </DialogTitle>
          </DialogHeader>

          {studentLessons.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">{isAr ? 'لا توجد دروس' : 'No lessons found'}</div>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead>{isAr ? 'المدة' : 'Duration'}</TableHead>
                    <TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead className="text-end">{isAr ? 'التقرير' : 'Report'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentLessons.map(entry => {
                    const report = getEntryReport(entry.id);
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>{format(new Date(entry.scheduled_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                        <TableCell>{entry.duration_minutes} {isAr ? 'د' : 'min'}</TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        <TableCell className="text-end">
                          {report ? (
                            <Button variant="ghost" size="sm" onClick={() => setLessonReportEntry(entry)}>
                              <FileText className="h-3.5 w-3.5 me-1" />{isAr ? 'عرض' : 'View'}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">{isAr ? 'لا يوجد' : 'None'}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Session Report Detail Dialog ── */}
      <Dialog open={!!lessonReportEntry} onOpenChange={() => setLessonReportEntry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? 'تقرير الجلسة' : 'Session Report'}</DialogTitle>
          </DialogHeader>
          {(() => {
            if (!lessonReportEntry) return null;
            const report = getEntryReport(lessonReportEntry.id);
            if (!report) return <p className="text-muted-foreground text-sm">{isAr ? 'لا يوجد تقرير' : 'No report'}</p>;
            const mins = Math.floor(report.session_duration_seconds / 60);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-0.5">{isAr ? 'بداية الجلسة' : 'Started'}</p>
                    <p className="font-medium">{format(new Date(report.started_at), 'yyyy-MM-dd HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">{isAr ? 'نهاية الجلسة' : 'Ended'}</p>
                    <p className="font-medium">{format(new Date(report.ended_at), 'yyyy-MM-dd HH:mm')}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground mb-0.5">{isAr ? 'المدة الفعلية' : 'Actual Duration'}</p>
                    <p className="font-medium">{mins} {isAr ? 'دقيقة' : 'min'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">{isAr ? 'الملخص' : 'Summary'}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.summary || '-'}</p>
                </div>
                {report.observations && (
                  <div>
                    <p className="text-sm font-semibold mb-1">{isAr ? 'الملاحظات' : 'Observations'}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.observations}</p>
                  </div>
                )}
                {report.performance_remarks && (
                  <div>
                    <p className="text-sm font-semibold mb-1">{isAr ? 'ملاحظات الأداء' : 'Performance Remarks'}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.performance_remarks}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentReports;
