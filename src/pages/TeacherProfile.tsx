import { useState, useEffect, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Clock, DollarSign, TrendingUp, AlertTriangle, CheckCircle, XCircle, Loader2, User, Calendar, Percent, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/PageSkeleton';
import { format } from 'date-fns';

const TeacherProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { user, role } = useAuth();
  const isAr = language === 'ar';

  const [teacher, setTeacher] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Session stats
  const [completedSessions, setCompletedSessions] = useState(0);
  const [scheduledSessions, setScheduledSessions] = useState(0);
  const [absentSessions, setAbsentSessions] = useState(0);
  const [totalLoggedMinutes, setTotalLoggedMinutes] = useState(0);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);

    // Fetch teacher + profile
    const { data: teacherData } = await supabase
      .from('teachers')
      .select('*, profiles:teachers_user_id_profiles_fkey(full_name, phone, email, avatar_url)')
      .eq('id', id)
      .single();

    if (!teacherData) { setLoading(false); return; }
    setTeacher(teacherData);
    setProfile(teacherData.profiles);

    // Fetch payout requests
    const { data: payouts } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('teacher_id', id)
      .order('created_at', { ascending: false });
    setPayoutRequests(payouts || []);

    // Fetch session stats for current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data: sessions } = await supabase
      .from('timetable_entries')
      .select('status, duration_minutes, scheduled_at')
      .eq('teacher_id', id)
      .gte('scheduled_at', monthStart)
      .lte('scheduled_at', monthEnd);

    if (sessions) {
      const completed = sessions.filter(s => s.status === 'completed');
      const scheduled = sessions.length;
      const cancelled = sessions.filter(s => s.status === 'cancelled');
      setCompletedSessions(completed.length);
      setScheduledSessions(scheduled);
      setAbsentSessions(cancelled.length);
      setTotalLoggedMinutes(completed.reduce((sum, s) => sum + (s.duration_minutes || 0), 0));
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  // Access control: only admin or the teacher themselves
  const isOwner = teacher && user && teacher.user_id === user.id;
  const canAccess = role === 'admin' || isOwner;

  // Calculations
  const actualLoggedHours = totalLoggedMinutes / 60;
  const requiredHours = teacher?.required_monthly_hours || 0;
  const remainingHours = Math.max(0, requiredHours - actualLoggedHours);
  const attendancePercentage = scheduledSessions > 0
    ? Math.round((completedSessions / scheduledSessions) * 100)
    : 0;
  const hourlyRate = teacher?.hourly_rate || 0;
  const expectedSalary = hourlyRate * requiredHours;
  const availableToPayout = hourlyRate * actualLoggedHours;

  // Deduct pending/approved payouts from available balance
  const pendingPayouts = payoutRequests
    .filter(p => p.status === 'under_review' || p.status === 'approved')
    .reduce((sum, p) => sum + Number(p.requested_amount), 0);
  const netAvailable = Math.max(0, availableToPayout - pendingPayouts);

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) {
      toast.error(isAr ? 'أدخل مبلغاً صحيحاً' : 'Enter a valid amount');
      return;
    }
    if (amount > netAvailable) {
      toast.error(isAr ? 'المبلغ يتجاوز الرصيد المتاح' : 'Amount exceeds available balance');
      return;
    }
    setPayoutLoading(true);
    const { error } = await supabase.from('payout_requests').insert({
      teacher_id: id!,
      requested_amount: amount,
      available_balance_at_request: netAvailable,
      status: 'under_review',
    });
    setPayoutLoading(false);
    if (error) {
      toast.error(isAr ? 'فشل في إرسال الطلب' : 'Failed to submit request');
    } else {
      toast.success(isAr ? 'تم إرسال طلب الصرف' : 'Payout request submitted');
      setPayoutOpen(false);
      setPayoutAmount('');
      fetchData();
    }
  };

  if (loading) return <TableSkeleton />;
  if (!teacher) return <div className="p-8 text-center text-muted-foreground">{isAr ? 'المعلم غير موجود' : 'Teacher not found'}</div>;
  if (!canAccess) return <Navigate to="/dashboard" replace />;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'under_review': return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">{isAr ? 'قيد المراجعة' : 'Under Review'}</Badge>;
      case 'approved': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">{isAr ? 'مقبول' : 'Approved'}</Badge>;
      case 'declined': return <Badge variant="destructive">{isAr ? 'مرفوض' : 'Declined'}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const statCards = [
    { label: isAr ? 'الساعات المطلوبة (شهرياً)' : 'Required Hours (Monthly)', value: `${requiredHours}h`, icon: Clock, color: 'text-blue-600' },
    { label: isAr ? 'الساعات المسجلة' : 'Actual Logged Hours', value: `${actualLoggedHours.toFixed(1)}h`, icon: TrendingUp, color: 'text-emerald-600' },
    { label: isAr ? 'الساعات المتبقية' : 'Remaining Hours', value: `${remainingHours.toFixed(1)}h`, icon: Clock, color: 'text-amber-600' },
    { label: isAr ? 'نسبة الحضور' : 'Attendance %', value: `${attendancePercentage}%`, icon: Percent, color: 'text-purple-600' },
    { label: isAr ? 'عدد الغيابات' : 'Absences', value: absentSessions.toString(), icon: AlertTriangle, color: 'text-red-600' },
    { label: isAr ? 'سعر الساعة' : 'Hourly Rate', value: `$${hourlyRate}`, icon: DollarSign, color: 'text-primary' },
    { label: isAr ? 'الراتب المتوقع' : 'Expected Salary', value: `$${expectedSalary.toFixed(2)}`, icon: DollarSign, color: 'text-blue-600' },
    { label: isAr ? 'متاح للصرف' : 'Available to Payout', value: `$${netAvailable.toFixed(2)}`, icon: CheckCircle, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'الملف الشخصي للمعلم' : 'Teacher Profile'}</h1>
          <p className="text-muted-foreground">{profile?.full_name} — {profile?.email}</p>
        </div>
        {(role === 'teacher' && isOwner) && (
          <Button onClick={() => { setPayoutAmount(netAvailable.toFixed(2)); setPayoutOpen(true); }} disabled={netAvailable <= 0}>
            <DollarSign className="h-4 w-4 me-2" />
            {isAr ? 'طلب صرف' : 'Request Payout'}
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`rounded-lg p-2 bg-muted ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Account Statement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{isAr ? 'كشف الحساب' : 'Account Statement'}</CardTitle>
        </CardHeader>
        <CardContent>
          {payoutRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{isAr ? 'لا توجد معاملات' : 'No transactions yet'}</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? 'المرجع' : 'Ref ID'}</TableHead>
                    <TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead>{isAr ? 'المبلغ' : 'Amount'}</TableHead>
                    <TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead>{isAr ? 'تاريخ الصرف' : 'Payout Date'}</TableHead>
                    <TableHead>{isAr ? 'ملاحظات' : 'Notes'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono text-xs">{req.transaction_ref}</TableCell>
                      <TableCell>{format(new Date(req.created_at), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-semibold">${Number(req.requested_amount).toFixed(2)}</TableCell>
                      <TableCell>{statusBadge(req.status)}</TableCell>
                      <TableCell>{req.reviewed_at ? format(new Date(req.reviewed_at), 'dd/MM/yyyy') : '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {req.decline_reason || req.admin_notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Request Dialog */}
      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isAr ? 'طلب صرف' : 'Request Payout'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{isAr ? 'الرصيد المتاح' : 'Available Balance'}</span>
                <span className="font-semibold text-emerald-600">${netAvailable.toFixed(2)}</span>
              </div>
            </div>
            <div>
              <Label>{isAr ? 'المبلغ المطلوب' : 'Requested Amount'}</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={netAvailable}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleRequestPayout} disabled={payoutLoading}>
              {payoutLoading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {isAr ? 'تأكيد الطلب' : 'Confirm Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherProfile;
