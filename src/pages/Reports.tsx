import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { subscriptionStatusLabels, subscriptionTypeLabels, getLabel } from '@/lib/statusLabels';
import { TableSkeleton } from '@/components/PageSkeleton';

const Reports = () => {
  const { language } = useLanguage();
  const { currency } = useAppSettings();
  const isAr = language === 'ar';

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [subsRes, attRes, profRes, studRes, courseRes] = await Promise.all([
        supabase.from('subscriptions').select('*'),
        supabase.from('attendance').select('*'),
        supabase.from('profiles').select('id, full_name'),
        supabase.from('students').select('id, user_id'),
        supabase.from('courses').select('id, title, title_ar'),
      ]);
      setSubscriptions(subsRes.data || []);
      setAttendance(attRes.data || []);
      setStudents(studRes.data || []);
      setCourses(courseRes.data || []);
      const pm: Record<string, string> = {};
      (profRes.data || []).forEach((p: any) => { pm[p.id] = p.full_name; });
      setProfiles(pm);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const getStudentName = (studentId: string) => {
    const s = students.find(st => st.id === studentId);
    return s ? (profiles[s.user_id] || studentId) : studentId;
  };
  const getCourseName = (courseId: string) => {
    const c = courses.find(co => co.id === courseId);
    return c ? (isAr && c.title_ar ? c.title_ar : c.title) : courseId;
  };

  const exportCSV = (headers: string[], rows: string[][], filename: string) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const subStatusCounts = {
    all: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    expired: subscriptions.filter(s => s.status === 'expired').length,
    cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
  };

  const filteredSubscriptions = useMemo(() => {
    let result = subStatusFilter === 'all' ? subscriptions : subscriptions.filter(s => s.status === subStatusFilter);
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return result;
  }, [subscriptions, subStatusFilter]);

  const sortedAttendance = useMemo(() => {
    return [...attendance].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [attendance]);

  const totalRevenue = subscriptions.reduce((s, sub) => s + (Number(sub.price) || 0), 0);
  const activeSubs = subscriptions.filter(s => s.status === 'active').length;

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{isAr ? 'التقارير والتحليلات' : 'Reports & Analytics'}</h1>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 me-2" />{isAr ? 'طباعة' : 'Print'}
        </Button>
      </div>

      <Tabs defaultValue="subscriptions">
        <TabsList>
          <TabsTrigger value="subscriptions">{isAr ? 'الاشتراكات' : 'Subscriptions'}</TabsTrigger>
          <TabsTrigger value="attendance">{isAr ? 'الحضور' : 'Attendance'}</TabsTrigger>
          <TabsTrigger value="finances">{isAr ? 'المالية' : 'Finances'}</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-2 gap-4">
              <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{subscriptions.length}</p><p className="text-sm text-muted-foreground">{isAr ? 'الإجمالي' : 'Total'}</p></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-primary">{activeSubs}</p><p className="text-sm text-muted-foreground">{isAr ? 'نشط' : 'Active'}</p></CardContent></Card>
            </div>
            <Button variant="outline" size="sm" onClick={() => exportCSV(
              ['Student', 'Course', 'Type', 'Status', 'Price', 'Start Date'],
              filteredSubscriptions.map(s => [getStudentName(s.student_id), getCourseName(s.course_id), getLabel(subscriptionTypeLabels, s.subscription_type, isAr), getLabel(subscriptionStatusLabels, s.status, isAr), String(s.price || 0), s.start_date]),
              'subscriptions-report'
            )}>
              <Download className="h-4 w-4 me-2" />CSV
            </Button>
          </div>

          {/* Status filter for subscriptions */}
          <Tabs value={subStatusFilter} onValueChange={setSubStatusFilter}>
            <TabsList>
              {Object.entries(subStatusCounts).map(([key, count]) => (
                <TabsTrigger key={key} value={key} className="text-xs gap-1.5">
                  {key === 'all' ? (isAr ? 'الكل' : 'All') : getLabel(subscriptionStatusLabels, key, isAr)}
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-[18px]">{count}</Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? 'الطالب' : 'Student'}</TableHead>
                    <TableHead>{isAr ? 'الدورة' : 'Course'}</TableHead>
                    <TableHead>{isAr ? 'النوع' : 'Type'}</TableHead>
                    <TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead>{isAr ? 'السعر' : 'Price'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>{getStudentName(s.student_id)}</TableCell>
                      <TableCell>{getCourseName(s.course_id)}</TableCell>
                      <TableCell><Badge variant="outline">{getLabel(subscriptionTypeLabels, s.subscription_type, isAr)}</Badge></TableCell>
                      <TableCell><Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{getLabel(subscriptionStatusLabels, s.status, isAr)}</Badge></TableCell>
                      <TableCell>{currency.symbol}{Number(s.price || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="flex items-center justify-end">
            <Button variant="outline" size="sm" onClick={() => exportCSV(
              ['Student', 'Status', 'Date', 'Notes'],
              sortedAttendance.map(a => [getStudentName(a.student_id), a.status, format(new Date(a.created_at), 'PP'), a.notes || '']),
              'attendance-report'
            )}>
              <Download className="h-4 w-4 me-2" />CSV
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? 'الطالب' : 'Student'}</TableHead>
                    <TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead>{isAr ? 'ملاحظات' : 'Notes'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAttendance.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>{getStudentName(a.student_id)}</TableCell>
                      <TableCell><Badge variant={a.status === 'present' ? 'default' : a.status === 'absent' ? 'destructive' : 'secondary'}>{a.status}</Badge></TableCell>
                      <TableCell>{format(new Date(a.created_at), 'PP')}</TableCell>
                      <TableCell className="text-muted-foreground">{a.notes || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finances" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{currency.symbol}{totalRevenue.toFixed(2)}</p><p className="text-sm text-muted-foreground">{isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-primary">{currency.symbol}{(activeSubs > 0 ? totalRevenue / activeSubs : 0).toFixed(2)}</p><p className="text-sm text-muted-foreground">{isAr ? 'متوسط الاشتراك' : 'Avg Subscription'}</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{activeSubs}</p><p className="text-sm text-muted-foreground">{isAr ? 'اشتراكات نشطة' : 'Active Subscriptions'}</p></CardContent></Card>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportCSV(
            ['Total Revenue', 'Active Subscriptions', 'Avg Subscription'],
            [[`${currency.symbol}${totalRevenue.toFixed(2)}`, String(activeSubs), `${currency.symbol}${(activeSubs > 0 ? totalRevenue / activeSubs : 0).toFixed(2)}`]],
            'finances-report'
          )}>
            <Download className="h-4 w-4 me-2" />{isAr ? 'تصدير CSV' : 'Export CSV'}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
