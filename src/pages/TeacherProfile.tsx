import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { resolveAvatarUrl } from '@/lib/storage';
import { uploadMedia, getMediaSignedUrl, MEDIA_PATHS } from '@/lib/mediaStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Clock, DollarSign, TrendingUp, AlertTriangle, CheckCircle,
  Loader2, Percent, Mail, Phone, User, Briefcase, FileText,
  Upload, ExternalLink, FileUp, Download,
} from 'lucide-react';
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

  // Avatar
  const [resolvedAvatar, setResolvedAvatar] = useState('');

  // File uploads
  const [cvUploading, setCvUploading] = useState(false);
  const [contractUploading, setContractUploading] = useState(false);
  const [cvSignedUrl, setCvSignedUrl] = useState('');
  const [contractSignedUrl, setContractSignedUrl] = useState('');

  // Session stats
  const [completedSessions, setCompletedSessions] = useState(0);
  const [scheduledSessions, setScheduledSessions] = useState(0);
  const [absentSessions, setAbsentSessions] = useState(0);
  const [totalLoggedMinutes, setTotalLoggedMinutes] = useState(0);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);

    const { data: teacherData } = await supabase
      .from('teachers')
      .select('*, profiles:teachers_user_id_profiles_fkey(full_name, phone, email, avatar_url)')
      .eq('id', id)
      .single();

    if (!teacherData) { setLoading(false); return; }
    setTeacher(teacherData);
    setProfile(teacherData.profiles);

    // Resolve avatar
    if (teacherData.profiles?.avatar_url) {
      resolveAvatarUrl(teacherData.profiles.avatar_url).then(setResolvedAvatar);
    }

    // Resolve CV / Contract signed URLs
    if (teacherData.cv_url) {
      getMediaSignedUrl(teacherData.cv_url).then(setCvSignedUrl);
    }
    if (teacherData.contract_url) {
      getMediaSignedUrl(teacherData.contract_url).then(setContractSignedUrl);
    }

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
      setCompletedSessions(completed.length);
      setScheduledSessions(sessions.length);
      setAbsentSessions(sessions.filter(s => s.status === 'cancelled').length);
      setTotalLoggedMinutes(completed.reduce((sum, s) => sum + (s.duration_minutes || 0), 0));
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  // Access control
  const isOwner = teacher && user && teacher.user_id === user.id;
  const canAccess = role === 'admin' || isOwner;
  const canEdit = role === 'admin';

  // Calculations
  const actualLoggedHours = totalLoggedMinutes / 60;
  const requiredHours = teacher?.required_monthly_hours || 0;
  const remainingHours = Math.max(0, requiredHours - actualLoggedHours);
  const attendancePercentage = scheduledSessions > 0
    ? Math.round((completedSessions / scheduledSessions) * 100) : 0;
  const hourlyRate = teacher?.hourly_rate || 0;
  const expectedSalary = hourlyRate * requiredHours;
  const availableToPayout = hourlyRate * actualLoggedHours;
  const pendingPayouts = payoutRequests
    .filter(p => p.status === 'under_review' || p.status === 'approved')
    .reduce((sum, p) => sum + Number(p.requested_amount), 0);
  const netAvailable = Math.max(0, availableToPayout - pendingPayouts);

  // File upload handlers
  const handleFileUpload = async (
    file: File,
    type: 'cv' | 'contract',
  ) => {
    const setUploading = type === 'cv' ? setCvUploading : setContractUploading;
    const directory = type === 'cv' ? MEDIA_PATHS.cv : MEDIA_PATHS.contracts;
    const column = type === 'cv' ? 'cv_url' : 'contract_url';

    setUploading(true);
    const { path, signedUrl, error } = await uploadMedia(directory, file, {
      fileName: `${id}-${file.name}`,
    });

    if (error) {
      toast.error(isAr ? 'فشل رفع الملف' : 'File upload failed');
      setUploading(false);
      return;
    }

    // Save path to teacher record
    const { error: updateError } = await supabase
      .from('teachers')
      .update({ [column]: path })
      .eq('id', id!);

    setUploading(false);

    if (updateError) {
      toast.error(isAr ? 'فشل في حفظ المسار' : 'Failed to save file path');
    } else {
      toast.success(
        type === 'cv'
          ? (isAr ? 'تم رفع السيرة الذاتية' : 'CV uploaded successfully')
          : (isAr ? 'تم رفع العقد' : 'Contract uploaded successfully')
      );
      if (type === 'cv') setCvSignedUrl(signedUrl);
      else setContractSignedUrl(signedUrl);
      fetchData();
    }
  };

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
      case 'approved': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border">{isAr ? 'مقبول' : 'Approved'}</Badge>;
      case 'declined': return <Badge variant="destructive">{isAr ? 'مرفوض' : 'Declined'}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const initials = (profile?.full_name || '?').charAt(0).toUpperCase();

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
        <h1 className="text-2xl font-bold">{isAr ? 'الملف الشخصي للمعلم' : 'Teacher Profile'}</h1>
        {(role === 'teacher' && isOwner) && (
          <Button onClick={() => { setPayoutAmount(netAvailable.toFixed(2)); setPayoutOpen(true); }} disabled={netAvailable <= 0}>
            <DollarSign className="h-4 w-4 me-2" />
            {isAr ? 'طلب صرف' : 'Request Payout'}
          </Button>
        )}
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {isAr ? 'المعلومات الشخصية' : 'Personal Information'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar & Name */}
            <div className="flex flex-col items-center gap-3 md:min-w-[160px]">
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage src={resolvedAvatar} alt={profile?.full_name} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-semibold text-lg">{profile?.full_name}</p>
                {teacher?.specialization && (
                  <p className="text-sm text-muted-foreground">{teacher.specialization}</p>
                )}
              </div>
            </div>

            <Separator orientation="vertical" className="hidden md:block h-auto" />

            {/* Contact Details */}
            <div className="flex-1 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{isAr ? 'البريد الإلكتروني' : 'Email'}</p>
                    <p className="text-sm font-medium truncate">{profile?.email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{isAr ? 'الهاتف' : 'Phone'}</p>
                    <p className="text-sm font-medium">{profile?.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{isAr ? 'التخصص' : 'Specialization'}</p>
                    <p className="text-sm font-medium">{teacher?.specialization || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{isAr ? 'السيرة الذاتية' : 'Bio'}</p>
                    <p className="text-sm font-medium line-clamp-2">{teacher?.bio || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">
                  {isAr ? 'المستندات' : 'Documents'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* CV */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <FileUp className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{isAr ? 'السيرة الذاتية (CV)' : 'CV / Resume'}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {teacher?.cv_url ? (isAr ? 'تم الرفع' : 'Uploaded') : (isAr ? 'لم يتم الرفع' : 'Not uploaded')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {teacher?.cv_url && cvSignedUrl && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={cvSignedUrl} target="_blank" rel="noopener noreferrer" title={isAr ? 'عرض' : 'View'}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 relative"
                          disabled={cvUploading}
                          title={isAr ? 'رفع' : 'Upload'}
                        >
                          {cvUploading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept=".pdf,.doc,.docx"
                            disabled={cvUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, 'cv');
                              e.target.value = '';
                            }}
                          />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Contract */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <FileText className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{isAr ? 'العقد' : 'Contract'}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {teacher?.contract_url ? (isAr ? 'تم الرفع' : 'Uploaded') : (isAr ? 'لم يتم الرفع' : 'Not uploaded')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {teacher?.contract_url && contractSignedUrl && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={contractSignedUrl} target="_blank" rel="noopener noreferrer" title={isAr ? 'عرض' : 'View'}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 relative"
                          disabled={contractUploading}
                          title={isAr ? 'رفع' : 'Upload'}
                        >
                          {contractUploading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept=".pdf,.doc,.docx"
                            disabled={contractUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, 'contract');
                              e.target.value = '';
                            }}
                          />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
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
