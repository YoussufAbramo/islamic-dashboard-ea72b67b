import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { subscriptionStatusLabels, subscriptionTypeLabels, getLabel } from '@/lib/statusLabels';
import { TableSkeleton } from '@/components/PageSkeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--destructive))'];
const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' };

const Reports = () => {
  const { language } = useLanguage();
  const { currency } = useAppSettings();
  const isAr = language === 'ar';

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [subsRes, profRes, studRes, courseRes] = await Promise.all([
        supabase.from('subscriptions').select('*'),
        supabase.from('profiles').select('id, full_name'),
        supabase.from('students').select('id, user_id'),
        supabase.from('courses').select('id, title, title_ar'),
      ]);
      setSubscriptions(subsRes.data || []);
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


  const totalRevenue = subscriptions.reduce((s, sub) => s + (Number(sub.price) || 0), 0);
  const activeSubs = subscriptions.filter(s => s.status === 'active').length;

  const subStatusPieData = useMemo(() => [
    { name: isAr ? 'نشط' : 'Active', value: subStatusCounts.active },
    { name: isAr ? 'منتهي' : 'Expired', value: subStatusCounts.expired },
    { name: isAr ? 'ملغي' : 'Cancelled', value: subStatusCounts.cancelled },
  ].filter(d => d.value > 0), [subscriptions, isAr]);

  const subMonthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    subscriptions.forEach(s => {
      const month = format(new Date(s.created_at), 'yyyy-MM');
      map[month] = (map[month] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month: format(new Date(month + '-01'), 'MMM yyyy'), count }));
  }, [subscriptions]);

  // === Finance chart data ===
  const revenueMonthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    subscriptions.forEach(s => {
      const month = format(new Date(s.created_at), 'yyyy-MM');
      map[month] = (map[month] || 0) + (Number(s.price) || 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, revenue]) => ({ month: format(new Date(month + '-01'), 'MMM yyyy'), revenue }));
  }, [subscriptions]);

  const revenueByTypePieData = useMemo(() => {
    const map: Record<string, number> = {};
    subscriptions.forEach(s => {
      const type = getLabel(subscriptionTypeLabels, s.subscription_type, isAr);
      map[type] = (map[type] || 0) + (Number(s.price) || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [subscriptions, isAr]);

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
          <TabsTrigger value="finances">{isAr ? 'المالية' : 'Finances'}</TabsTrigger>
        </TabsList>

        {/* ── Subscriptions Tab ── */}
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

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">{isAr ? 'الاشتراكات الشهرية' : 'Monthly Subscriptions'}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={subMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-muted-foreground" tick={{ fontSize: 11 }} />
                    <YAxis className="text-muted-foreground" allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" name={isAr ? 'اشتراكات' : 'Subscriptions'} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">{isAr ? 'حالة الاشتراكات' : 'Subscription Status'}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={subStatusPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {subStatusPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Status filter */}
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

        {/* ── Finances Tab ── */}
        <TabsContent value="finances" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{currency.symbol}{totalRevenue.toFixed(2)}</p><p className="text-sm text-muted-foreground">{isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-primary">{currency.symbol}{(activeSubs > 0 ? totalRevenue / activeSubs : 0).toFixed(2)}</p><p className="text-sm text-muted-foreground">{isAr ? 'متوسط الاشتراك' : 'Avg Subscription'}</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{activeSubs}</p><p className="text-sm text-muted-foreground">{isAr ? 'اشتراكات نشطة' : 'Active Subscriptions'}</p></CardContent></Card>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">{isAr ? 'الإيرادات الشهرية' : 'Monthly Revenue'}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={revenueMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-muted-foreground" tick={{ fontSize: 11 }} />
                    <YAxis className="text-muted-foreground" tickFormatter={(v) => `${currency.symbol}${v}`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${currency.symbol}${value.toFixed(2)}`, isAr ? 'الإيراد' : 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">{isAr ? 'الإيرادات حسب النوع' : 'Revenue by Type'}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={revenueByTypePieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {revenueByTypePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${currency.symbol}${value.toFixed(2)}`, isAr ? 'الإيراد' : 'Revenue']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
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
