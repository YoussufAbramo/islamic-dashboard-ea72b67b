import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { resolveAvatarUrl } from '@/lib/storage';
import { uploadMedia, getMediaSignedUrl, MEDIA_PATHS } from '@/lib/mediaStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ImagePickerField from '@/components/media/ImagePickerField';
import { BadgeSummaryCards, BadgeIconsRow } from '@/components/badges/TeacherBadges';
import { useTeacherBadges } from '@/hooks/use-teacher-badges';
import {
  Clock, DollarSign, TrendingUp, AlertTriangle, CheckCircle,
  Loader2, Percent, Mail, Phone, User, Briefcase, FileText,
  ExternalLink, FileUp, Pencil, X, Save, Award, Maximize2, Minimize2,
  CalendarDays, Wallet, Info, Eye, HeadphonesIcon, Receipt, Cake,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { ACTION_BTN, ACTION_ICON } from '@/lib/actionBtnClass';
import { TableSkeleton } from '@/components/PageSkeleton';
import { format } from 'date-fns';

const TeacherProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const isAr = language === 'ar';

  const [teacher, setTeacher] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [quickViewReq, setQuickViewReq] = useState<any>(null);
  const [adminProfiles, setAdminProfiles] = useState<Record<string, string>>({});
  const [authInfo, setAuthInfo] = useState<{ created_at?: string; last_sign_in_at?: string } | null>(null);

  // Support ticket dialog
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '', department: '', priority: '' });
  const [ticketLoading, setTicketLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);

  // Avatar
  const [resolvedAvatar, setResolvedAvatar] = useState('');

  // File uploads - signed URLs for viewing
  const [cvSignedUrl, setCvSignedUrl] = useState('');
  const [contractSignedUrl, setContractSignedUrl] = useState('');

  // Session stats
  const [completedSessions, setCompletedSessions] = useState(0);
  const [scheduledSessions, setScheduledSessions] = useState(0);
  const [absentSessions, setAbsentSessions] = useState(0);
  const [totalLoggedSeconds, setTotalLoggedSeconds] = useState(0);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '', email: '', phone: '', title: '', specialization: '', bio: '',
    hourly_rate: 0, gender: '', date_of_birth: '',
  });
  const [saving, setSaving] = useState(false);

  // Subscriptions
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [requiredMonthlyHours, setRequiredMonthlyHours] = useState(0);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);

    const { data: teacherData } = await supabase
      .from('teachers')
      .select('*, profiles:teachers_user_id_profiles_fkey(id, full_name, phone, email, avatar_url)')
      .eq('id', id)
      .single();

    if (!teacherData) { setLoading(false); return; }
    setTeacher(teacherData);
    setProfile(teacherData.profiles);

    setEditForm({
      full_name: teacherData.profiles?.full_name || '',
      email: teacherData.profiles?.email || '',
      phone: teacherData.profiles?.phone || '',
      title: (teacherData as any).title || '',
      specialization: teacherData.specialization || '',
      bio: teacherData.bio || '',
      hourly_rate: teacherData.hourly_rate || 0,
      gender: (teacherData as any).gender || '',
      date_of_birth: (teacherData as any).date_of_birth || '',
    });

    if (teacherData.profiles?.avatar_url) {
      resolveAvatarUrl(teacherData.profiles.avatar_url).then(setResolvedAvatar);
    }

    if (teacherData.cv_url) getMediaSignedUrl(teacherData.cv_url).then(setCvSignedUrl);
    if (teacherData.contract_url) getMediaSignedUrl(teacherData.contract_url).then(setContractSignedUrl);

    // Fetch auth info (created_at, last_sign_in_at) via edge function
    supabase.functions.invoke('manage-users', {
      body: { action: 'get-user-info', user_id: teacherData.user_id },
    }).then(({ data }) => {
      if (data) setAuthInfo(data);
    });

    const { data: payouts } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('teacher_id', id)
      .order('created_at', { ascending: false });
    setPayoutRequests(payouts || []);

    // Fetch admin names for reviewed payouts
    const adminIds = [...new Set((payouts || []).filter(p => p.admin_id).map(p => p.admin_id))];
    if (adminIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', adminIds);
      const map: Record<string, string> = {};
      (profiles || []).forEach(p => { map[p.id] = p.full_name; });
      setAdminProfiles(map);
    }

    // Session stats (current month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data: reports } = await supabase
      .from('session_reports')
      .select('session_duration_seconds')
      .eq('teacher_id', id)
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd);

    if (reports) {
      setTotalLoggedSeconds(reports.reduce((sum, r) => sum + (r.session_duration_seconds || 0), 0));
    }

    const { data: sessions } = await supabase
      .from('timetable_entries')
      .select('status')
      .eq('teacher_id', id)
      .gte('scheduled_at', monthStart)
      .lte('scheduled_at', monthEnd);

    if (sessions) {
      const absenceStatuses = ['teacher_not_attend', 'student_not_attend', 'not_attend'];
      setCompletedSessions(sessions.filter(s => s.status === 'completed').length);
      setScheduledSessions(sessions.length);
      setAbsentSessions(sessions.filter(s => absenceStatuses.includes(s.status)).length);
    }

    // Subscriptions
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*, courses:course_id(title, title_ar), students:student_id(id, user_id, profiles:students_user_id_profiles_fkey(full_name))')
      .eq('teacher_id', id)
      .order('created_at', { ascending: false });
    setSubscriptions(subs || []);

    const activeSubs = (subs || []).filter(s => s.status === 'active');
    const totalMinutesPerMonth = activeSubs.reduce((sum, s) => {
      const duration = s.lesson_duration || 60;
      const weeklyLessons = s.weekly_lessons || 1;
      return sum + (duration * weeklyLessons * 4.33);
    }, 0);
    setRequiredMonthlyHours(Math.round((totalMinutesPerMonth / 60) * 10) / 10);

    setLoading(false);
  };

  useEffect(() => {
    const fetchMeta = async () => {
      const [{ data: deptData }, { data: prioData }] = await Promise.all([
        supabase.from('support_departments').select('id, name, name_ar').eq('is_active', true).order('sort_order'),
        supabase.from('support_priorities').select('id, name, name_ar, color').eq('is_active', true).order('sort_order'),
      ]);
      setDepartments(deptData || []);
      setPriorities(prioData || []);
    };
    fetchMeta();
  }, []);

  useEffect(() => { fetchData(); }, [id]);

  const isOwner = teacher && user && teacher.user_id === user.id;
  const canAccess = role === 'admin' || isOwner;
  const canEdit = role === 'admin';

  // Badges / Achievements
  const { categories: badgeCategories, loading: badgesLoading } = useTeacherBadges(id, teacher?.user_id);

  const actualLoggedHours = totalLoggedSeconds / 3600;
  const remainingHours = Math.max(0, requiredMonthlyHours - actualLoggedHours);
  const attendancePercentage = scheduledSessions > 0
    ? Math.round((completedSessions / scheduledSessions) * 100) : 0;
  const hourlyRate = teacher?.hourly_rate || 0;
  const expectedSalary = hourlyRate * requiredMonthlyHours;
  const availableToPayout = hourlyRate * actualLoggedHours;
  const pendingPayouts = payoutRequests
    .filter(p => p.status === 'under_review' || p.status === 'approved')
    .reduce((sum, p) => sum + Number(p.requested_amount), 0);
  const netAvailable = Math.max(0, availableToPayout - pendingPayouts);

  // Calculate per-subscription monthly hours & salary
  const getSubMonthlyHours = (sub: any) => {
    const duration = sub.lesson_duration || 60;
    const weeklyLessons = sub.weekly_lessons || 1;
    return Math.round((duration * weeklyLessons * 4.33 / 60) * 10) / 10;
  };
  const getSubMonthlySalary = (sub: any) => {
    return getSubMonthlyHours(sub) * hourlyRate;
  };

  const handleAvatarChange = async (url: string) => {
    if (!teacher?.profiles?.id) return;
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', teacher.user_id);
    setResolvedAvatar(url);
    toast.success(isAr ? 'تم تحديث الصورة' : 'Avatar updated');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error: teacherError } = await supabase
      .from('teachers')
      .update({
        title: editForm.title,
        specialization: editForm.specialization,
        bio: editForm.bio,
        hourly_rate: editForm.hourly_rate,
        gender: editForm.gender || null,
        date_of_birth: editForm.date_of_birth || null,
      })
      .eq('id', id!);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: editForm.full_name,
        phone: editForm.phone,
        email: editForm.email,
      })
      .eq('id', teacher.user_id);

    setSaving(false);
    if (teacherError || profileError) {
      toast.error(isAr ? 'فشل في حفظ التعديلات' : 'Failed to save changes');
    } else {
      toast.success(isAr ? 'تم حفظ التعديلات' : 'Profile updated successfully');
      setEditing(false);
      fetchData();
    }
  };

  // Handle document URL change from ImagePickerField
  const handleDocumentChange = async (url: string, type: 'cv' | 'contract') => {
    const column = type === 'cv' ? 'cv_url' : 'contract_url';
    const { error } = await supabase
      .from('teachers')
      .update({ [column]: url })
      .eq('id', id!);

    if (error) {
      toast.error(isAr ? 'فشل في حفظ المسار' : 'Failed to save file path');
    } else {
      toast.success(
        type === 'cv'
          ? (isAr ? 'تم تحديث السيرة الذاتية' : 'CV updated successfully')
          : (isAr ? 'تم تحديث العقد' : 'Contract updated successfully')
      );
      if (type === 'cv') setCvSignedUrl(url);
      else setContractSignedUrl(url);
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

      // Push notifications to all admins
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      if (adminRoles && adminRoles.length > 0) {
        const teacherName = profile?.full_name || 'Teacher';
        const notifications = adminRoles.map(ar => ({
          user_id: ar.user_id,
          title: isAr ? 'طلب صرف جديد' : 'New Payout Request',
          message: isAr
            ? `${teacherName} طلب صرف مبلغ $${amount.toFixed(2)}`
            : `${teacherName} requested a payout of $${amount.toFixed(2)}`,
          link: '/dashboard/payout-requests',
        }));
        await supabase.from('notifications').insert(notifications);
      }

      fetchData();
    }
  };

  if (loading) return <TableSkeleton />;
  if (!teacher) return <div className="p-8 text-center text-muted-foreground">{isAr ? 'المعلم غير موجود' : 'Teacher not found'}</div>;
  if (!canAccess) return <Navigate to="/dashboard" replace />;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'under_review': return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20">{isAr ? 'قيد المراجعة' : 'Under Review'}</Badge>;
      case 'approved': return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">{isAr ? 'مقبول' : 'Approved'}</Badge>;
      case 'declined': return <Badge variant="destructive">{isAr ? 'مرفوض' : 'Declined'}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const subStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">{isAr ? 'نشط' : 'Active'}</Badge>;
      case 'paused': return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20">{isAr ? 'متوقف' : 'Paused'}</Badge>;
      case 'cancelled': return <Badge variant="destructive">{isAr ? 'ملغي' : 'Cancelled'}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const initials = (profile?.full_name || '?').charAt(0).toUpperCase();

  const statCardsRow1 = [
    { label: isAr ? 'الساعات المطلوبة (شهرياً)' : 'Required Hours (Monthly)', value: `${requiredMonthlyHours}h`, icon: Clock, color: 'text-blue-600' },
    { label: isAr ? 'الساعات المسجلة' : 'Actual Logged Hours', value: `${actualLoggedHours.toFixed(1)}h`, icon: TrendingUp, color: 'text-emerald-600' },
    { label: isAr ? 'الساعات المتبقية' : 'Remaining Hours', value: `${remainingHours.toFixed(1)}h`, icon: Clock, color: 'text-amber-600' },
    { label: isAr ? 'إجمالي الراتب' : 'Total Salary', value: `$${expectedSalary.toFixed(2)}`, icon: DollarSign, color: 'text-blue-600' },
  ];

  const statCardsRow2 = [
    { label: isAr ? 'الحصص المكتملة' : 'Completed Sessions', value: completedSessions.toString(), icon: CheckCircle, color: 'text-emerald-600' },
    { label: isAr ? 'حصص الغياب' : 'Absence Sessions', value: absentSessions.toString(), icon: AlertTriangle, color: 'text-red-600' },
    { label: isAr ? 'نسبة الحضور' : 'Attendance %', value: `${(completedSessions + absentSessions) > 0 ? Math.round((completedSessions / (completedSessions + absentSessions)) * 100) : 0}%`, icon: Percent, color: 'text-purple-600' },
    { label: isAr ? 'الأوسمة المحصّلة' : 'Badges Collected', value: badgeCategories.reduce((s, c) => s + c.totalEarned, 0).toString(), icon: Award, color: 'text-amber-600' },
  ];

  const handleSubmitTicket = async () => {
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      toast.error(isAr ? 'الموضوع والرسالة مطلوبان' : 'Subject and message are required');
      return;
    }
    setTicketLoading(true);
    const { error } = await supabase.from('support_tickets').insert({
      name: profile?.full_name || '',
      email: profile?.email || '',
      subject: ticketForm.subject,
      message: ticketForm.message,
      department: ticketForm.department || (departments[0]?.name || 'general'),
      priority: ticketForm.priority || (priorities[0]?.name || 'medium'),
      user_id: user?.id,
    });
    setTicketLoading(false);
    if (error) {
      toast.error(isAr ? 'فشل في إرسال التذكرة' : 'Failed to submit ticket');
    } else {
      toast.success(isAr ? 'تم إرسال التذكرة بنجاح' : 'Ticket submitted successfully');
      setTicketOpen(false);
      setTicketForm({ subject: '', message: '', department: '', priority: '' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isAr ? 'الملف الشخصي للمعلم' : 'Teacher Profile'}</h1>
        {canEdit && !editing && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4 me-2" />
            {isAr ? 'تعديل' : 'Edit Profile'}
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
          {editing ? (
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                <div className="shrink-0">
                  <Label className="mb-2 block text-xs text-muted-foreground">{isAr ? 'صورة الملف الشخصي' : 'Profile Picture'}</Label>
                  <ImagePickerField
                    value={resolvedAvatar}
                    onChange={handleAvatarChange}
                    bucket="media"
                  />
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? 'الاسم الكامل' : 'Full Name'}</Label>
                    <Input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? 'المسمى الوظيفي' : 'Title'}</Label>
                    <Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} placeholder={isAr ? 'مثال: أستاذ مساعد' : 'e.g. Senior Instructor'} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? 'البريد الإلكتروني' : 'Email'}</Label>
                    <Input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? 'الهاتف' : 'Phone'}</Label>
                    <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? 'الجنس' : 'Gender'}</Label>
                    <Select value={editForm.gender} onValueChange={v => setEditForm({ ...editForm, gender: v })}>
                      <SelectTrigger><SelectValue placeholder={isAr ? 'اختر...' : 'Select...'} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{isAr ? 'ذكر' : 'Male'}</SelectItem>
                        <SelectItem value="female">{isAr ? 'أنثى' : 'Female'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? 'تاريخ الميلاد' : 'Date of Birth'}</Label>
                    <Input type="date" value={editForm.date_of_birth} onChange={e => setEditForm({ ...editForm, date_of_birth: e.target.value })} />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? 'التخصص' : 'Specialization'}</Label>
                  <Input value={editForm.specialization} onChange={e => setEditForm({ ...editForm, specialization: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? 'سعر الساعة ($)' : 'Hourly Rate ($)'}</Label>
                  <Input type="number" min={0} step="0.01" value={editForm.hourly_rate} onChange={e => setEditForm({ ...editForm, hourly_rate: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'الساعات الشهرية المطلوبة' : 'Required Monthly Hours'}</Label>
                  <div className="flex items-center gap-2">
                    <Input disabled value={`${requiredMonthlyHours}h`} className="bg-muted" />
                    <Badge variant="outline" className="shrink-0 text-[10px]">{isAr ? 'محسوبة تلقائياً' : 'Auto-calculated'}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{isAr ? 'يتم حسابها تلقائياً من الاشتراكات النشطة المعينة' : 'Automatically calculated from assigned active subscriptions'}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? 'نبذة تعريفية' : 'Bio'}</Label>
                <Textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} rows={3} />
              </div>

              <Separator />

              {/* Documents - using ImagePickerField */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">{isAr ? 'المستندات' : 'Documents'}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{isAr ? 'السيرة الذاتية (PDF, DOC)' : 'CV / Resume (PDF, DOC)'}</p>
                    <ImagePickerField
                      label={isAr ? 'السيرة الذاتية (CV)' : 'CV / Resume'}
                      value={teacher?.cv_url || ''}
                      onChange={(url) => handleDocumentChange(url, 'cv')}
                      bucket="media"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{isAr ? 'العقد (PDF, DOC)' : 'Contract (PDF, DOC)'}</p>
                    <ImagePickerField
                      label={isAr ? 'العقد' : 'Contract'}
                      value={teacher?.contract_url || ''}
                      onChange={(url) => handleDocumentChange(url, 'contract')}
                      bucket="media"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />}
                  {isAr ? 'حفظ التعديلات' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4 me-2" />
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar & Name & Payout */}
              <div className="flex flex-col items-center gap-3 md:w-[200px] md:min-w-[200px] md:max-w-[200px]">
                <Avatar className="h-24 w-24 border-2 border-border">
                  <AvatarImage src={resolvedAvatar} alt={profile?.full_name} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-semibold text-lg">{profile?.full_name}</p>
                  {(teacher as any)?.title && (
                    <p className="text-sm text-primary font-medium">{(teacher as any).title}</p>
                  )}
                  {teacher?.specialization && (
                    <p className="text-xs text-muted-foreground">{teacher.specialization}</p>
                  )}
                </div>

                {/* Available to Payout Card */}
                <div className="w-full mt-2 rounded-xl border bg-emerald-500/5 p-3 text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Wallet className="h-3.5 w-3.5" />
                    {isAr ? 'متاح للصرف' : 'Available to Payout'}
                  </div>
                  <p className="text-xl font-bold text-emerald-600">${netAvailable.toFixed(2)}</p>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => { setPayoutAmount(netAvailable.toFixed(2)); setPayoutOpen(true); }}
                    disabled={netAvailable <= 0}
                  >
                    <DollarSign className="h-3.5 w-3.5 me-1" />
                    {isAr ? 'طلب صرف' : 'Request Payout'}
                  </Button>
                </div>

                {/* Payout Policy Note */}
                <div className="w-full rounded-xl border border-border bg-muted/40 p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <p className="text-[11px] font-semibold text-foreground">{isAr ? 'سياسة الصرف' : 'Payout Policy'}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isAr
                      ? 'يتم صرف المستحقات وفقاً لسياسات الصرف الخاصة بنا. إذا كان طلبك مخالفاً لسياساتنا، سيتم رفض الطلب وإعادة المبلغ إلى رصيدك.'
                      : 'Payouts are processed following our payout policies. If your request violates our policies, it will be rejected and the amount will be returned to your balance.'}
                  </p>
                  <Link to="/policies/payout-policy" className="inline-flex items-center gap-1 text-[11px] text-primary font-medium hover:underline">
                    {isAr ? 'اطلع على سياسة الصرف' : 'View Payout Policy'}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

              </div>

              <Separator orientation="vertical" className="hidden md:block h-auto" />

              {/* Contact Details */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <InfoCard icon={<Mail className="h-3.5 w-3.5" />} label={isAr ? 'البريد الإلكتروني' : 'Email'} value={profile?.email || '-'} small />
                  <InfoCard icon={<Phone className="h-3.5 w-3.5" />} label={isAr ? 'الهاتف' : 'Phone'} value={profile?.phone || '-'} small />
                  <InfoCard icon={<Briefcase className="h-3.5 w-3.5" />} label={isAr ? 'التخصص' : 'Specialization'} value={teacher?.specialization || '-'} small />
                  <InfoCard icon={<DollarSign className="h-3.5 w-3.5" />} label={isAr ? 'سعر الساعة' : 'Hourly Rate'} value={`$${hourlyRate}`} small />
                  <InfoCard icon={<User className="h-3.5 w-3.5" />} label={isAr ? 'الجنس' : 'Gender'} value={(teacher as any)?.gender ? ((teacher as any).gender === 'male' ? (isAr ? 'ذكر' : 'Male') : (isAr ? 'أنثى' : 'Female')) : '-'} small />
                  <InfoCard icon={<Cake className="h-3.5 w-3.5" />} label={isAr ? 'العمر' : 'Age'} value={(teacher as any)?.date_of_birth ? `${Math.floor((Date.now() - new Date((teacher as any).date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} ${isAr ? 'سنة' : 'years'}` : '-'} small />
                  <InfoCard icon={<CalendarDays className="h-3.5 w-3.5" />} label={isAr ? 'تاريخ إنشاء الحساب' : 'Account Created'} value={authInfo?.created_at ? format(new Date(authInfo.created_at), 'dd/MM/yyyy HH:mm') : '-'} small />
                  <InfoCard icon={<Clock className="h-3.5 w-3.5" />} label={isAr ? 'آخر تسجيل دخول' : 'Last Login'} value={authInfo?.last_sign_in_at ? format(new Date(authInfo.last_sign_in_at), 'dd/MM/yyyy HH:mm') : '-'} small />
                </div>

                {/* Bio - full width */}
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-[11px] text-muted-foreground font-medium">{isAr ? 'نبذة تعريفية' : 'Bio'}</p>
                  </div>
                  <p className="text-sm">{teacher?.bio || '-'}</p>
                </div>

                {/* Documents - View mode */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2.5 font-medium">
                    {isAr ? 'المستندات' : 'Documents'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <DocumentViewCard
                      label={isAr ? 'السيرة الذاتية (CV)' : 'CV / Resume'}
                      uploaded={!!teacher?.cv_url}
                      signedUrl={cvSignedUrl}
                      isAr={isAr}
                      icon={<FileUp className="h-4 w-4 text-blue-600" />}
                      iconBg="bg-blue-500/10"
                    />
                    <DocumentViewCard
                      label={isAr ? 'العقد' : 'Contract'}
                      uploaded={!!teacher?.contract_url}
                      signedUrl={contractSignedUrl}
                      isAr={isAr}
                      icon={<FileText className="h-4 w-4 text-emerald-600" />}
                      iconBg="bg-emerald-500/10"
                    />
                  </div>
                </div>

                {/* Badge Icons — Personal Info Section */}
                {!badgesLoading && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2.5 font-medium">
                      {isAr ? 'الأوسمة والإنجازات' : 'Badges & Achievements'}
                    </p>
                    <BadgeIconsRow categories={badgeCategories} isAr={isAr} />
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCardsRow1.map((stat, i) => (
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

      {/* Stats Grid - Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCardsRow2.map((stat, i) => (
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

      {/* Achievements Summary Cards */}
      {!badgesLoading && <BadgeSummaryCards categories={badgeCategories} isAr={isAr} />}

      {/* Assigned Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            {isAr ? 'الاشتراكات المعينة' : 'Assigned Subscriptions'}
            <Badge variant="secondary" className="ms-auto">{subscriptions.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">{isAr ? 'لا توجد اشتراكات' : 'No subscriptions assigned'}</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? 'الطالب' : 'Student'}</TableHead>
                    <TableHead>{isAr ? 'المقرر' : 'Course'}</TableHead>
                    <TableHead>{isAr ? 'مدة الحصة' : 'Duration'}</TableHead>
                    <TableHead>{isAr ? 'حصص أسبوعية' : 'Weekly'}</TableHead>
                    <TableHead>{isAr ? 'ساعات/شهر' : 'Hours/Mo'}</TableHead>
                    <TableHead>{isAr ? 'الراتب/شهر' : 'Salary/Mo'}</TableHead>
                    <TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => {
                    const subHours = getSubMonthlyHours(sub);
                    const subSalary = getSubMonthlySalary(sub);
                    return (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{(sub.students as any)?.profiles?.full_name || '-'}</TableCell>
                        <TableCell>{isAr ? ((sub.courses as any)?.title_ar || (sub.courses as any)?.title) : (sub.courses as any)?.title}</TableCell>
                        <TableCell>{sub.lesson_duration || 60} {isAr ? 'د' : 'min'}</TableCell>
                        <TableCell>{sub.weekly_lessons || 1}</TableCell>
                        <TableCell className="font-medium">{subHours}h</TableCell>
                        <TableCell className="font-semibold text-emerald-600">${subSalary.toFixed(2)}</TableCell>
                        <TableCell>{subStatusBadge(sub.status)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Statement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            {isAr ? 'كشف الحساب' : 'Account Statement'}
          </CardTitle>
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
                    <TableHead>{isAr ? 'تاريخ الطلب' : 'Date of Request'}</TableHead>
                    <TableHead>{isAr ? 'الرصيد قبل' : 'Bal Before'}</TableHead>
                    <TableHead>{isAr ? 'مبلغ الصرف' : 'Payout Amount'}</TableHead>
                    <TableHead>{isAr ? 'الرصيد بعد' : 'Bal After'}</TableHead>
                    <TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead>{isAr ? 'إجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutRequests.map((req) => {
                    const balanceBefore = Number(req.available_balance_at_request) + Number(req.requested_amount);
                    const balanceAfter = Number(req.available_balance_at_request);
                    return (
                      <TableRow key={req.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-xs">{req.transaction_ref}</TableCell>
                        <TableCell className="text-sm">{format(new Date(req.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell className="text-muted-foreground">${balanceBefore.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">${Number(req.requested_amount).toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground">${balanceAfter.toFixed(2)}</TableCell>
                        <TableCell>{statusBadge(req.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className={ACTION_BTN} onClick={() => setQuickViewReq(req)} title={isAr ? 'التفاصيل' : 'Details'}>
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
        </CardContent>
      </Card>

      {/* Quick View Dialog */}
      <Dialog open={!!quickViewReq} onOpenChange={(open) => !open && setQuickViewReq(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              {isAr ? 'تفاصيل الطلب' : 'Request Details'}
            </DialogTitle>
          </DialogHeader>
          {quickViewReq && (() => {
            const balanceBefore = Number(quickViewReq.available_balance_at_request) + Number(quickViewReq.requested_amount);
            const balanceAfter = Number(quickViewReq.available_balance_at_request);
            return (
              <div className="space-y-3">
                <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'المرجع' : 'Ref ID'}</span><span className="font-mono text-xs">{quickViewReq.transaction_ref}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'المبلغ المطلوب' : 'Requested Amount'}</span><span className="font-semibold">${Number(quickViewReq.requested_amount).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الرصيد قبل' : 'Balance Before'}</span><span>${balanceBefore.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الرصيد بعد' : 'Balance After'}</span><span>${balanceAfter.toFixed(2)}</span></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'تاريخ الطلب' : 'Date of Request'}</span><span>{format(new Date(quickViewReq.created_at), 'dd/MM/yyyy HH:mm')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الحالة' : 'Status'}</span>{statusBadge(quickViewReq.status)}</div>
                  {quickViewReq.reviewed_at && (
                    <>
                      <Separator />
                      <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'تاريخ المراجعة' : 'Reviewed At'}</span><span>{format(new Date(quickViewReq.reviewed_at), 'dd/MM/yyyy HH:mm')}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'بواسطة' : 'Reviewed By'}</span><span className="font-medium">{quickViewReq.admin_id ? (adminProfiles[quickViewReq.admin_id] || '-') : '-'}</span></div>
                    </>
                  )}
                  {quickViewReq.decline_reason && (
                    <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'سبب الرفض' : 'Decline Reason'}</span><span className="text-destructive text-xs max-w-[200px] text-end">{quickViewReq.decline_reason}</span></div>
                  )}
                  {role === 'admin' && quickViewReq.admin_notes && (
                    <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'ملاحظات المشرف' : 'Admin Notes'}</span><span className="text-xs max-w-[200px] text-end">{quickViewReq.admin_notes}</span></div>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => { setQuickViewReq(null); setTicketForm({ subject: `Payout Request: ${quickViewReq.transaction_ref}`, message: '', department: '', priority: '' }); setTicketOpen(true); }}>
                  <HeadphonesIcon className="h-3.5 w-3.5" />
                  {isAr ? 'تقديم تذكرة دعم' : 'Submit Support Ticket'}
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

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
              <Input type="number" step="0.01" min="0.01" max={netAvailable} value={payoutAmount}
                onChange={e => setPayoutAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {isAr
                  ? 'بتقديم هذا الطلب، فإنك توافق على سياسات الصرف الخاصة بنا.'
                  : 'By submitting this request, you agree to our payout policies.'}
                {' '}
                <Link to="/policies/payout-policy" className="text-primary underline hover:no-underline font-medium">
                  {isAr ? 'اطلع على السياسة' : 'View Policy'}
                </Link>
              </p>
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

      {/* Support Ticket Dialog */}
      <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeadphonesIcon className="h-5 w-5 text-primary" />
              {isAr ? 'تقديم تذكرة دعم' : 'Submit Support Ticket'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? 'الموضوع' : 'Subject'} *</Label>
              <Input value={ticketForm.subject} onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })} placeholder={isAr ? 'موضوع التذكرة...' : 'Ticket subject...'} />
            </div>
            {departments.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? 'القسم' : 'Department'}</Label>
                <Select value={ticketForm.department} onValueChange={v => setTicketForm({ ...ticketForm, department: v })}>
                  <SelectTrigger><SelectValue placeholder={isAr ? 'اختر...' : 'Select...'} /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.name}>{isAr ? (d.name_ar || d.name) : d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {priorities.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? 'الأولوية' : 'Priority'}</Label>
                <Select value={ticketForm.priority} onValueChange={v => setTicketForm({ ...ticketForm, priority: v })}>
                  <SelectTrigger><SelectValue placeholder={isAr ? 'اختر...' : 'Select...'} /></SelectTrigger>
                  <SelectContent>
                    {priorities.map(p => (
                      <SelectItem key={p.id} value={p.name}>{isAr ? (p.name_ar || p.name) : p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? 'الرسالة' : 'Message'} *</Label>
              <Textarea value={ticketForm.message} onChange={e => setTicketForm({ ...ticketForm, message: e.target.value })} placeholder={isAr ? 'اشرح مشكلتك...' : 'Describe your issue...'} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTicketOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleSubmitTicket} disabled={ticketLoading}>
              {ticketLoading ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Send className="h-4 w-4 me-2" />}
              {isAr ? 'إرسال' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ── Reusable Sub-Components ── */

const InfoCard = ({ icon, label, value, truncate, small }: { icon: React.ReactNode; label: string; value: string; truncate?: boolean; small?: boolean }) => (
  <div className={`flex items-center gap-2.5 rounded-lg border bg-muted/30 ${small ? 'p-2.5' : 'p-3'}`}>
    <span className="text-muted-foreground shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className={`text-muted-foreground uppercase tracking-wider ${small ? 'text-[10px]' : 'text-[11px]'}`}>{label}</p>
      <p className={`font-medium ${truncate ? 'line-clamp-2' : ''} ${small ? 'text-xs' : 'text-sm'}`}>{value}</p>
    </div>
  </div>
);

interface DocumentViewCardProps {
  label: string;
  uploaded: boolean;
  signedUrl: string;
  isAr: boolean;
  icon: React.ReactNode;
  iconBg: string;
  onPreview?: () => void;
}

const DocumentViewCard = ({ label, uploaded, signedUrl, isAr, icon, iconBg, onPreview }: DocumentViewCardProps) => (
  <div className="flex items-center justify-between p-3 rounded-lg border bg-card gap-3">
    <div className="flex items-center gap-2.5 min-w-0">
      <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">
          {uploaded ? (isAr ? 'تم الرفع' : 'Uploaded') : (isAr ? 'لم يتم الرفع' : 'Not uploaded')}
        </p>
      </div>
    </div>
    {uploaded && signedUrl && (
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPreview} title={isAr ? 'معاينة' : 'Preview'}>
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <a href={signedUrl} target="_blank" rel="noopener noreferrer" title={isAr ? 'فتح في نافذة جديدة' : 'Open in new tab'}><ExternalLink className="h-3.5 w-3.5" /></a>
        </Button>
      </div>
    )}
  </div>
);

export default TeacherProfile;
