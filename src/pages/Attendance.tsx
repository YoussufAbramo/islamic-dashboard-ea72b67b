import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  student_id: string;
  timetable_entry_id: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface StudentInfo {
  id: string;
  user_id: string;
  assigned_teacher_id: string | null;
  profile?: { full_name: string };
}

interface TeacherInfo {
  id: string;
  user_id: string;
  profile?: { full_name: string };
}



const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const Attendance = () => {
  const { role } = useAuth();
  const { language } = useLanguage();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  

  const isAr = language === 'ar';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [attRes, studRes, teachRes, profRes] = await Promise.all([
        supabase.from('attendance').select('*'),
        supabase.from('students').select('id, user_id, assigned_teacher_id'),
        supabase.from('teachers').select('id, user_id'),
        supabase.from('profiles').select('id, full_name'),
      ]);

      setAttendance(attRes.data || []);
      setStudents(studRes.data || []);
      setTeachers(teachRes.data || []);

      const pMap: Record<string, string> = {};
      (profRes.data || []).forEach((p: any) => { pMap[p.id] = p.full_name; });
      setProfiles(pMap);
      setLoading(false);
    };
    fetchData();
  }, []);

  const sortedAttendance = useMemo(() => {
    const sorted = [...attendance];
    sorted.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return sorted;
  }, [attendance, sortOrder]);

  // Build per-student stats
  const studentStats = students.map((s) => {
    const records = sortedAttendance.filter((a) => a.student_id === s.id);
    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const excused = records.filter((r) => r.status === 'excused').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { name: profiles[s.user_id] || (isAr ? 'طالب' : 'Student'), studentId: s.id, teacherId: s.assigned_teacher_id, total, present, absent, late, excused, rate };
  }).filter((s) => s.total > 0);

  const teacherStats = teachers.map((t) => {
    const assignedStudentIds = students.filter((s) => s.assigned_teacher_id === t.id).map((s) => s.id);
    const records = sortedAttendance.filter((a) => assignedStudentIds.includes(a.student_id));
    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const excused = records.filter((r) => r.status === 'excused').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { name: profiles[t.user_id] || (isAr ? 'معلم' : 'Teacher'), teacherId: t.id, total, present, absent, late, excused, rate };
  }).filter((t) => t.total > 0);

  const totalRecords = attendance.length;
  const totalPresent = attendance.filter((a) => a.status === 'present').length;
  const totalAbsent = attendance.filter((a) => a.status === 'absent').length;
  const totalLate = attendance.filter((a) => a.status === 'late').length;
  const totalExcused = attendance.filter((a) => a.status === 'excused').length;
  const overallRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

  const pieData = [
    { name: isAr ? 'حاضر' : 'Present', value: totalPresent },
    { name: isAr ? 'غائب' : 'Absent', value: totalAbsent },
    { name: isAr ? 'متأخر' : 'Late', value: totalLate },
    { name: isAr ? 'معذور' : 'Excused', value: totalExcused },
  ].filter((d) => d.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{isAr ? 'تتبع الحضور' : 'Attendance Tracking'}</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card><CardContent className="pt-6 text-center"><CheckCircle className="h-8 w-8 mx-auto text-primary mb-2" /><p className="text-2xl font-bold">{overallRate}%</p><p className="text-sm text-muted-foreground">{isAr ? 'معدل الحضور' : 'Attendance Rate'}</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><UserCheck className="h-8 w-8 mx-auto text-primary mb-2" /><p className="text-2xl font-bold">{totalPresent}</p><p className="text-sm text-muted-foreground">{isAr ? 'حاضر' : 'Present'}</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><XCircle className="h-8 w-8 mx-auto text-destructive mb-2" /><p className="text-2xl font-bold">{totalAbsent}</p><p className="text-sm text-muted-foreground">{isAr ? 'غائب' : 'Absent'}</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" /><p className="text-2xl font-bold">{totalLate + totalExcused}</p><p className="text-sm text-muted-foreground">{isAr ? 'متأخر / معذور' : 'Late / Excused'}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">{isAr ? 'حسب الطالب' : 'Per Student'}</TabsTrigger>
          <TabsTrigger value="teachers">{isAr ? 'حسب المعلم' : 'Per Teacher'}</TabsTrigger>
          <TabsTrigger value="overview">{isAr ? 'نظرة عامة' : 'Overview'}</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-6">
          {studentStats.length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">{isAr ? 'لا توجد بيانات حضور للطلاب' : 'No student attendance data available'}</CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle>{isAr ? 'معدل حضور الطلاب' : 'Student Attendance Rates'}</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(300, studentStats.length * 50)}>
                    <BarChart data={studentStats} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} className="text-muted-foreground" />
                      <YAxis type="category" dataKey="name" width={120} className="text-muted-foreground" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`${value}%`, isAr ? 'معدل الحضور' : 'Attendance Rate']} />
                      <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{isAr ? 'تفاصيل حضور الطلاب' : 'Student Attendance Breakdown'}</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(300, studentStats.length * 50)}>
                    <BarChart data={studentStats} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" className="text-muted-foreground" />
                      <YAxis type="category" dataKey="name" width={120} className="text-muted-foreground" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="present" name={isAr ? 'حاضر' : 'Present'} stackId="a" fill="hsl(var(--primary))" />
                      <Bar dataKey="absent" name={isAr ? 'غائب' : 'Absent'} stackId="a" fill="hsl(var(--destructive))" />
                      <Bar dataKey="late" name={isAr ? 'متأخر' : 'Late'} stackId="a" fill="hsl(var(--chart-3))" />
                      <Bar dataKey="excused" name={isAr ? 'معذور' : 'Excused'} stackId="a" fill="hsl(var(--chart-4))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="teachers" className="space-y-6">
          {teacherStats.length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">{isAr ? 'لا توجد بيانات حضور للمعلمين' : 'No teacher attendance data available'}</CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle>{isAr ? 'معدل حضور طلاب كل معلم' : 'Teacher Student Attendance Rates'}</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(300, teacherStats.length * 60)}>
                    <BarChart data={teacherStats} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} className="text-muted-foreground" />
                      <YAxis type="category" dataKey="name" width={120} className="text-muted-foreground" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`${value}%`, isAr ? 'معدل الحضور' : 'Attendance Rate']} />
                      <Bar dataKey="rate" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{isAr ? 'تفاصيل حضور طلاب المعلمين' : 'Teacher Student Attendance Breakdown'}</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(300, teacherStats.length * 60)}>
                    <BarChart data={teacherStats} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" className="text-muted-foreground" />
                      <YAxis type="category" dataKey="name" width={120} className="text-muted-foreground" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="present" name={isAr ? 'حاضر' : 'Present'} stackId="a" fill="hsl(var(--primary))" />
                      <Bar dataKey="absent" name={isAr ? 'غائب' : 'Absent'} stackId="a" fill="hsl(var(--destructive))" />
                      <Bar dataKey="late" name={isAr ? 'متأخر' : 'Late'} stackId="a" fill="hsl(var(--chart-3))" />
                      <Bar dataKey="excused" name={isAr ? 'معذور' : 'Excused'} stackId="a" fill="hsl(var(--chart-4))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{isAr ? 'توزيع الحضور الإجمالي' : 'Overall Attendance Distribution'}</CardTitle></CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <p className="text-center text-muted-foreground">{isAr ? 'لا توجد بيانات' : 'No data'}</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((_, index) => (<Cell key={index} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{isAr ? 'ملخص الإحصائيات' : 'Statistics Summary'}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border"><span className="text-sm">{isAr ? 'إجمالي السجلات' : 'Total Records'}</span><Badge variant="secondary">{totalRecords}</Badge></div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border"><span className="text-sm">{isAr ? 'حاضر' : 'Present'}</span><Badge className="bg-primary/10 text-primary">{totalPresent}</Badge></div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border"><span className="text-sm">{isAr ? 'غائب' : 'Absent'}</span><Badge variant="destructive">{totalAbsent}</Badge></div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border"><span className="text-sm">{isAr ? 'متأخر' : 'Late'}</span><Badge variant="outline">{totalLate}</Badge></div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border"><span className="text-sm">{isAr ? 'معذور' : 'Excused'}</span><Badge variant="outline">{totalExcused}</Badge></div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50"><span className="text-sm font-medium">{isAr ? 'معدل الحضور العام' : 'Overall Attendance Rate'}</span><Badge className="bg-primary text-primary-foreground">{overallRate}%</Badge></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Attendance;
