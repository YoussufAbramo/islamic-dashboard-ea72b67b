import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import JoinMeetingDialog from '@/components/attend/JoinMeetingDialog';
import SessionReportDialog from '@/components/attend/SessionReportDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, differenceInMinutes, isToday, isTomorrow, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { Video, Clock, MonitorPlay, AlertCircle, CalendarDays, FileText, XCircle, FlaskConical, Timer, User, BookOpen } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/PageSkeleton';
import EmptyState from '@/components/EmptyState';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface LessonEntry {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  course_id: string | null;
  student_id: string | null;
  teacher_id: string | null;
  course_title: string;
  student_name: string;
  teacher_name: string;
  google_meet_url: string;
  zoom_url: string;
  has_report?: boolean;
}

interface SessionReportView {
  id: string;
  session_duration_seconds: number;
  summary: string;
  observations: string;
  performance_remarks: string;
  started_at: string;
  ended_at: string;
  student_name: string;
  teacher_name: string;
  course_title: string;
}

const formatReportDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
};

const AttendLesson = () => {
  const { language } = useLanguage();
  const { role, user } = useAuth();
  const { activeSessionId, startSession, clearSession, setPendingAttend } = useSession();
  const isAr = language === 'ar';
  const [entries, setEntries] = useState<LessonEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [testMode, setTestMode] = useState(() => {
    try { return localStorage.getItem('attend_test_mode') === 'true'; } catch { return false; }
  });
  const [joinOpen, setJoinOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LessonEntry | null>(null);

  // Track which platform was used to join so "Open Meeting" can skip selection
  const lastJoinedPlatformRef = useRef<string | null>(null);

  // Session report state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSessionData, setReportSessionData] = useState<{
    timetableEntryId: string;
    teacherId: string | null;
    studentId: string | null;
    courseId: string | null;
    durationSeconds: number;
    startedAt: string;
  } | null>(null);

  // Set of entry IDs that already have reports
  const [reportedEntryIds, setReportedEntryIds] = useState<Set<string>>(new Set());
  const [reportDurations, setReportDurations] = useState<Map<string, number>>(new Map());
  const [viewReport, setViewReport] = useState<SessionReportView | null>(null);
  const [viewReportLoading, setViewReportLoading] = useState(false);
  const [cancelEntry, setCancelEntry] = useState<LessonEntry | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Update "now" every 30 seconds for live status updates
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for end-session request from TopBar
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { durationSeconds: number; startedAt: string };
      if (!activeSessionId) return;
      const entry = entries.find(e => e.id === activeSessionId);
      setReportSessionData({
        timetableEntryId: activeSessionId,
        teacherId: entry?.teacher_id || null,
        studentId: entry?.student_id || null,
        courseId: entry?.course_id || null,
        durationSeconds: detail.durationSeconds,
        startedAt: detail.startedAt,
      });
      setReportOpen(true);
    };
    window.addEventListener('session-end-request', handler);
    return () => window.removeEventListener('session-end-request', handler);
  }, [activeSessionId, entries]);

  const fetchEntries = async () => {
    setLoading(true);

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
    const extendedEnd = addDays(weekEnd, 7);

    const { data: timetableData, error } = await supabase
      .from('timetable_entries')
      .select('*, courses:course_id(title), students:student_id(id, user_id, profiles:students_user_id_profiles_fkey(full_name)), teachers_rel:teacher_id(id, user_id, profiles:teachers_user_id_profiles_fkey(full_name))')
      .gte('scheduled_at', weekStart.toISOString())
      .lte('scheduled_at', extendedEnd.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error fetching timetable:', error);
      setLoading(false);
      return;
    }

    // Get subscription URLs
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('student_id, teacher_id, course_id, google_meet_url, zoom_url');

    const subMap = new Map<string, { google_meet_url: string; zoom_url: string }>();
    (subscriptions || []).forEach(sub => {
      const fullKey = `${sub.student_id}|${sub.teacher_id}|${sub.course_id}`;
      subMap.set(fullKey, {
        google_meet_url: sub.google_meet_url || '',
        zoom_url: sub.zoom_url || '',
      });
      const pairKey = `${sub.student_id}|${sub.teacher_id}|`;
      if (!subMap.has(pairKey)) {
        subMap.set(pairKey, {
          google_meet_url: sub.google_meet_url || '',
          zoom_url: sub.zoom_url || '',
        });
      }
    });

    // Get existing session reports for these entries
    const entryIds = (timetableData || []).map((e: any) => e.id);
    let reportedIds = new Set<string>();
    const durationsMap = new Map<string, number>();
    if (entryIds.length > 0) {
      const { data: reports } = await supabase
        .from('session_reports' as any)
        .select('timetable_entry_id, session_duration_seconds')
        .in('timetable_entry_id', entryIds);
      if (reports) {
        (reports as any[]).forEach((r: any) => {
          reportedIds.add(r.timetable_entry_id);
          if (r.session_duration_seconds) {
            durationsMap.set(r.timetable_entry_id, Math.round(r.session_duration_seconds / 60));
          }
        });
      }
    }
    setReportedEntryIds(reportedIds);
    setReportDurations(durationsMap);

    const mapped: LessonEntry[] = (timetableData || []).map((e: any) => {
      const fullKey = `${e.student_id}|${e.teacher_id}|${e.course_id}`;
      const pairKey = `${e.student_id}|${e.teacher_id}|`;
      const urls = subMap.get(fullKey) || subMap.get(pairKey) || { google_meet_url: '', zoom_url: '' };
      return {
        id: e.id,
        scheduled_at: e.scheduled_at,
        duration_minutes: e.duration_minutes,
        status: e.status,
        course_id: e.course_id,
        student_id: e.student_id,
        teacher_id: e.teacher_id,
        course_title: e.courses?.title || '-',
        student_name: e.students?.profiles?.full_name || '-',
        teacher_name: e.teachers_rel?.profiles?.full_name || '-',
        google_meet_url: urls.google_meet_url,
        zoom_url: urls.zoom_url,
        has_report: reportedIds.has(e.id),
      };
    });

    setEntries(mapped);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  // Update pending attend in context for TopBar
  useEffect(() => {
    if (activeSessionId) {
      setPendingAttend(null);
      return;
    }
    // Find the first entry that can be attended
    const attendable = entries.find(e => isAttendEnabled(e));
    if (attendable) {
      setPendingAttend({
        id: attendable.id,
        courseTitle: attendable.course_title,
        studentName: attendable.student_name,
        onAttend: () => handleAttendClick(attendable),
      });
    } else {
      setPendingAttend(null);
    }
    return () => setPendingAttend(null);
  }, [entries, activeSessionId, now]);

  const getLessonStatus = (entry: LessonEntry): { label: string; variant: string; className: string; isLive: boolean } => {
    const scheduledTime = new Date(entry.scheduled_at);
    const endTime = new Date(scheduledTime.getTime() + entry.duration_minutes * 60000);

    if (activeSessionId === entry.id) {
      return { label: isAr ? 'جلسة نشطة' : 'In Session', variant: 'default', className: 'bg-emerald-600 text-white border-emerald-600', isLive: true };
    }
    if (entry.status === 'teacher_not_attend' || entry.status === 'student_not_attend' || entry.status === 'not_attend') {
      return { label: isAr ? 'غياب' : 'Absence', variant: 'outline', className: 'border-destructive/40 text-destructive bg-destructive/5', isLive: false };
    }
    if (entry.status === 'postponed') {
      return { label: isAr ? 'مؤجل' : 'Postponed', variant: 'outline', className: 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5', isLive: false };
    }
    if (entry.status === 'cancelled') {
      return { label: isAr ? 'ملغى' : 'Cancelled', variant: 'outline', className: 'border-muted-foreground/30 text-muted-foreground bg-muted/50 line-through', isLive: false };
    }
    if (entry.status === 'completed' || entry.has_report) {
      return { label: isAr ? 'انتهى' : 'Ended', variant: 'outline', className: 'border-muted-foreground/30 text-muted-foreground bg-muted/50', isLive: false };
    }
    if (now > endTime) {
      return { label: isAr ? 'انتهى' : 'Ended', variant: 'outline', className: 'border-muted-foreground/30 text-muted-foreground bg-muted/50', isLive: false };
    }
    if (now >= scheduledTime && now <= endTime) {
      return { label: isAr ? 'جلسة جارية' : 'In Session', variant: 'default', className: 'bg-destructive text-destructive-foreground border-destructive animate-pulse', isLive: true };
    }
    return { label: isAr ? 'قادم' : 'Upcoming', variant: 'outline', className: 'border-primary/40 text-primary bg-primary/5', isLive: false };
  };

  // In test mode, the first non-completed/cancelled entry has all restrictions lifted
  const testEntryId = testMode ? entries.find(e => e.status !== 'cancelled' && e.status !== 'completed' && !e.has_report && !reportedEntryIds.has(e.id))?.id : null;

  const terminalStatuses = ['teacher_not_attend', 'student_not_attend', 'not_attend', 'postponed', 'completed', 'cancelled'];

  const isAttendEnabled = (entry: LessonEntry): boolean => {
    if (activeSessionId) return false;
    if (entry.has_report || reportedEntryIds.has(entry.id)) return false;
    if (terminalStatuses.includes(entry.status)) return false;
    if (testMode && entry.id === testEntryId) return true;
    const scheduledTime = new Date(entry.scheduled_at);
    const endTime = new Date(scheduledTime.getTime() + entry.duration_minutes * 60000);
    const minutesUntil = differenceInMinutes(scheduledTime, now);
    return minutesUntil <= 15 && now <= endTime;
  };

  // "Not Attend" is available until 30 mins before lesson, disabled within 30 mins
  const isNotAttendEnabled = (entry: LessonEntry): boolean => {
    if (activeSessionId === entry.id) return false;
    if (entry.has_report || reportedEntryIds.has(entry.id)) return false;
    if (terminalStatuses.includes(entry.status)) return false;
    if (testMode && entry.id === testEntryId) return true;
    const scheduledTime = new Date(entry.scheduled_at);
    const minutesUntil = differenceInMinutes(scheduledTime, now);
    return minutesUntil > 30;
  };

  const isNotAttendVisible = (entry: LessonEntry): boolean => {
    if (activeSessionId === entry.id) return false;
    if (entry.has_report || reportedEntryIds.has(entry.id)) return false;
    if (terminalStatuses.includes(entry.status)) return false;
    const scheduledTime = new Date(entry.scheduled_at);
    const endTime = new Date(scheduledTime.getTime() + entry.duration_minutes * 60000);
    return now < endTime;
  };

  const handleCancelSubmit = async () => {
    if (!cancelEntry) return;
    if (!cancelReason.trim()) {
      toast.error(isAr ? 'يرجى كتابة سبب الإلغاء' : 'Please provide a cancellation reason');
      return;
    }
    const { error } = await supabase
      .from('timetable_entries')
      .update({ status: 'cancelled', cancellation_reason: cancelReason.trim() } as any)
      .eq('id', cancelEntry.id);
    if (error) {
      toast.error(isAr ? 'فشل إلغاء الدرس' : 'Failed to cancel lesson');
      return;
    }
    toast.success(isAr ? 'تم إلغاء الدرس' : 'Lesson cancelled');
    setCancelEntry(null);
    setCancelReason('');
    fetchEntries();
  };

  const handleAttendClick = (entry: LessonEntry) => {
    setSelectedEntry(entry);
    setJoinOpen(true);
  };

  /** "Open Meeting" for active session — reopen the same platform directly */
  const handleOpenMeeting = (entry: LessonEntry) => {
    const platform = lastJoinedPlatformRef.current;

    if (platform === 'google_meet' && entry.google_meet_url) {
      window.open(entry.google_meet_url, '_blank', 'noopener,noreferrer');
      toast.success(isAr ? 'تم فتح Google Meet' : 'Opening Google Meet');
      return;
    }
    if (platform === 'zoom' && entry.zoom_url) {
      window.open(entry.zoom_url, '_blank', 'noopener,noreferrer');
      toast.success(isAr ? 'تم فتح Zoom' : 'Opening Zoom');
      return;
    }
    // Fallback: open platform list
    setSelectedEntry(entry);
    setJoinOpen(true);
  };

  const handleSessionStart = useCallback((entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    startSession({
      id: entryId,
      courseTitle: entry?.course_title || '',
      studentName: entry?.student_name || '',
      teacherId: entry?.teacher_id || null,
      studentId: entry?.student_id || null,
      courseId: entry?.course_id || null,
    });
    toast.success(isAr ? 'بدأت الجلسة — المؤقت يعمل' : 'Session started — timer is running');
  }, [entries, isAr, startSession]);

  // Called after report is submitted
  const handleReportSubmitted = useCallback(() => {
    if (activeSessionId) {
      setReportedEntryIds(prev => new Set([...prev, activeSessionId]));
    }
    lastJoinedPlatformRef.current = null;
    clearSession();
    setReportSessionData(null);
    fetchEntries();
  }, [activeSessionId, clearSession]);

  const handleViewReport = async (entry: LessonEntry) => {
    setViewReportLoading(true);
    setViewReport(null);

    const { data } = await supabase
      .from('session_reports' as any)
      .select('*')
      .eq('timetable_entry_id', entry.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && (data as any[]).length > 0) {
      const r = (data as any[])[0];

      // Fetch names in parallel
      const [studentRes, teacherRes, courseRes] = await Promise.all([
        r.student_id ? supabase.from('students').select('profiles:students_user_id_profiles_fkey(full_name)').eq('id', r.student_id).single() : { data: null },
        r.teacher_id ? supabase.from('teachers').select('profiles:teachers_user_id_profiles_fkey(full_name)').eq('id', r.teacher_id).single() : { data: null },
        r.course_id ? supabase.from('courses').select('title').eq('id', r.course_id).single() : { data: null },
      ]);

      setViewReport({
        id: r.id,
        session_duration_seconds: r.session_duration_seconds,
        summary: r.summary || '',
        observations: r.observations || '',
        performance_remarks: r.performance_remarks || '',
        started_at: r.started_at,
        ended_at: r.ended_at,
        student_name: (studentRes.data as any)?.profiles?.full_name || entry.student_name,
        teacher_name: (teacherRes.data as any)?.profiles?.full_name || entry.teacher_name,
        course_title: (courseRes.data as any)?.title || entry.course_title,
      });
    }
    setViewReportLoading(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return isAr ? 'اليوم' : 'Today';
    if (isTomorrow(d)) return isAr ? 'غداً' : 'Tomorrow';
    return format(d, 'EEE, MMM d');
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return format(d, 'h:mm a');
  };

  const sortedEntries = useMemo(() => {
    if (!testMode || !testEntryId) return entries;
    const testEntry = entries.find(e => e.id === testEntryId);
    const rest = entries.filter(e => e.id !== testEntryId);
    return testEntry ? [testEntry, ...rest] : entries;
  }, [entries, testMode, testEntryId]);

  // Stats
  const liveCount = entries.filter(e => getLessonStatus(e).isLive).length;
  const todayCount = entries.filter(e => isToday(new Date(e.scheduled_at))).length;
  const weekTotal = entries.length;

  // Find the active entry for the banner display
  const activeEntry = activeSessionId ? entries.find(e => e.id === activeSessionId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'حضور الجلسة' : 'Attend Session'}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr ? 'عرض وحضور الجلسات المجدولة لهذا الأسبوع' : 'View and attend your scheduled sessions this week'}
          </p>
        </div>
        {role === 'admin' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/30">
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{isAr ? 'وضع الاختبار' : 'Test Mode'}</span>
            <Switch checked={testMode} onCheckedChange={setTestMode} />
          </div>
        )}
      </div>

      {/* Active Session Banner */}
      {activeEntry && (
        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <MonitorPlay className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {isAr ? 'جلسة نشطة' : 'Active Session'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {activeEntry.course_title} — {activeEntry.student_name}
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <MonitorPlay className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{liveCount}</p>
              <p className="text-xs text-muted-foreground">{isAr ? 'مباشر الآن' : 'Live Now'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayCount}</p>
              <p className="text-xs text-muted-foreground">{isAr ? 'دروس اليوم' : "Today's Lessons"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{weekTotal}</p>
              <p className="text-xs text-muted-foreground">{isAr ? 'دروس الأسبوع' : 'This Week'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info note with attendance policy */}
      <div className="flex items-start gap-2 p-3 rounded-lg border bg-muted/30">
        <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          {isAr
            ? 'زر "حضور" يتم تفعيله تلقائياً قبل 15 دقيقة من موعد الدرس. عند الانضمام يبدأ مؤقت الجلسة ويجب إنهاء الجلسة وكتابة تقرير.'
            : 'The "Attend" button activates 15 minutes before the lesson. Joining starts a session timer — end the session to submit a report.'}
        </p>
      </div>
      <div className="flex items-start gap-2 p-3 rounded-lg border bg-muted/30">
        <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          {isAr
            ? 'خيار "الغياب" متاح حتى 30 دقيقة قبل موعد الجلسة. خلال آخر 30 دقيقة، لا يمكن إلغاء الحضور. لمزيد من التفاصيل، راجع '
            : 'The "Absence" option is available up to 30 minutes before the session. Within the last 30 minutes, cancellation is not allowed. For more details, see the '}
          <a href="/policies/attendance-policy" target="_blank" className="text-primary underline underline-offset-2 hover:text-primary/80">
            {isAr ? 'سياسة الحضور' : 'Attendance Policy'}
          </a>.
        </p>
      </div>

      {/* Lessons Table */}
      {loading ? (
        <TableSkeleton />
      ) : sortedEntries.length === 0 ? (
        <EmptyState
          icon={Video}
          title={isAr ? 'لا توجد دروس مجدولة' : 'No Scheduled Lessons'}
          description={isAr ? 'لا توجد دروس مجدولة لهذا الأسبوع' : 'No lessons are scheduled for this week.'}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead>{isAr ? 'الوقت' : 'Time'}</TableHead>
                  <TableHead>{isAr ? 'الطالب' : 'Student'}</TableHead>
                  <TableHead>{isAr ? 'المعلم' : 'Teacher'}</TableHead>
                  <TableHead>{isAr ? 'المدة' : 'Duration'}</TableHead>
                  <TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead>{isAr ? 'التقرير' : 'Report'}</TableHead>
                  <TableHead className="text-center">{isAr ? 'إجراء' : 'Action'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEntries.map(entry => {
                  const status = getLessonStatus(entry);
                  const canAttend = isAttendEnabled(entry);
                  const isActiveEntry = activeSessionId === entry.id;
                  const hasReport = entry.has_report || reportedEntryIds.has(entry.id);
                  const showNotAttend = isNotAttendVisible(entry);
                  const canNotAttend = isNotAttendEnabled(entry);
                  const isTestEntry = testMode && entry.id === testEntryId;

                  return (
                    <TableRow key={entry.id} className={`${isTestEntry ? 'bg-violet-500/10 border-l-4 border-l-violet-500 ring-1 ring-violet-500/20' : isActiveEntry ? 'bg-emerald-500/5' : status.isLive ? 'bg-destructive/5' : ''}`}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium">{formatDate(entry.scheduled_at)}</p>
                            {isTestEntry && <Badge className="bg-violet-500 text-white text-[9px] px-1.5 py-0 h-4">TEST</Badge>}
                          </div>
                          <p className="text-[10px] text-muted-foreground">{format(new Date(entry.scheduled_at), 'yyyy-MM-dd')}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{formatTime(entry.scheduled_at)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{entry.student_name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{entry.teacher_name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{entry.duration_minutes} {isAr ? 'د' : 'min'}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${status.className}`}>
                          {status.isLive && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
                            </span>
                          )}
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        {hasReport ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 px-2 h-auto py-1 border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] hover:bg-emerald-500/20"
                            onClick={() => handleViewReport(entry)}
                          >
                            <Timer className="h-3 w-3" />
                            {reportDurations.get(entry.id) != null
                              ? `${reportDurations.get(entry.id)} ${isAr ? 'د' : 'min'}`
                              : (isAr ? 'عرض التقرير' : 'View Report')}
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">{isAr ? 'لا يوجد' : 'None'}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {isActiveEntry ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenMeeting(entry)}
                              className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                            >
                              <Video className="h-3.5 w-3.5" />
                              {isAr ? 'فتح الاجتماع' : 'Open Meeting'}
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                disabled={!canAttend && !isTestEntry}
                                onClick={() => handleAttendClick(entry)}
                                className="gap-1.5"
                              >
                                <Video className="h-3.5 w-3.5" />
                                {isAr ? 'حضور' : 'Attend'}
                              </Button>
                              {(showNotAttend || isTestEntry) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={!canNotAttend && !isTestEntry}
                                  onClick={() => { setCancelEntry(entry); setCancelReason(''); }}
                                  className="gap-1 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  {isAr ? 'عدم الحضور' : 'Not Attending'}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Join Meeting Dialog — starts session on join */}
      <JoinMeetingDialog
        open={joinOpen}
        onOpenChange={(val) => {
          setJoinOpen(val);
        }}
        entry={selectedEntry}
        entryId={selectedEntry?.id}
        isAr={isAr}
        onSessionStart={() => {
          if (selectedEntry) {
            handleSessionStart(selectedEntry.id);
          }
        }}
        onPlatformSelected={(platform) => {
          lastJoinedPlatformRef.current = platform;
        }}
      />

      {/* Session Report Dialog — closing does NOT end session */}
      <SessionReportDialog
        open={reportOpen}
        onOpenChange={(val) => {
          setReportOpen(val);
          // Just close the dialog, do NOT end the session
        }}
        isAr={isAr}
        sessionData={reportSessionData}
        onReportSubmitted={handleReportSubmitted}
      />

      {/* View Report Dialog — direct detail view */}
      <Dialog open={!!viewReport || viewReportLoading} onOpenChange={(val) => { if (!val) { setViewReport(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {isAr ? 'تقرير الجلسة' : 'Session Report'}
            </DialogTitle>
          </DialogHeader>
          {viewReportLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
          ) : viewReport ? (
            <div className="space-y-4">
              {/* Duration + Course */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-card">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">{isAr ? 'المدة' : 'Duration'}</p>
                    <p className="text-sm font-semibold">{formatReportDuration(viewReport.session_duration_seconds)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-card">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">{isAr ? 'الدورة' : 'Course'}</p>
                    <p className="text-sm font-semibold truncate">{viewReport.course_title}</p>
                  </div>
                </div>
              </div>

              {/* Student + Teacher */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-card">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">{isAr ? 'الطالب' : 'Student'}</p>
                    <p className="text-sm font-medium truncate">{viewReport.student_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-card">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">{isAr ? 'المعلم' : 'Teacher'}</p>
                    <p className="text-sm font-medium truncate">{viewReport.teacher_name}</p>
                  </div>
                </div>
              </div>

              {/* Time range */}
              <p className="text-xs text-muted-foreground text-center">
                {format(new Date(viewReport.started_at), 'MMM d, yyyy — h:mm a')} → {format(new Date(viewReport.ended_at), 'h:mm a')}
              </p>

              {/* Report Fields */}
              {viewReport.summary && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">{isAr ? 'الملخص' : 'Summary'}</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-xl leading-relaxed">{viewReport.summary}</p>
                </div>
              )}
              {viewReport.observations && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">{isAr ? 'الملاحظات' : 'Observations'}</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-xl leading-relaxed">{viewReport.observations}</p>
                </div>
              )}
              {viewReport.performance_remarks && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">{isAr ? 'ملاحظات الأداء' : 'Performance Remarks'}</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-xl leading-relaxed">{viewReport.performance_remarks}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">{isAr ? 'لا توجد تقارير جلسات بعد' : 'No session reports yet'}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancellation Dialog */}
      <Dialog open={!!cancelEntry} onOpenChange={(val) => { if (!val) { setCancelEntry(null); setCancelReason(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              {isAr ? 'إلغاء الدرس' : 'Cancel Lesson'}
            </DialogTitle>
          </DialogHeader>
          {cancelEntry && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border bg-muted/30 text-sm">
                <p className="font-medium">{cancelEntry.course_title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cancelEntry.student_name} — {format(new Date(cancelEntry.scheduled_at), 'MMM d, h:mm a')}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                  {isAr ? 'سبب الإلغاء' : 'Cancellation Reason'} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={isAr ? 'اكتب سبب إلغاء الدرس...' : 'Write the reason for cancelling this lesson...'}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setCancelEntry(null); setCancelReason(''); }}>
                  {isAr ? 'تراجع' : 'Go Back'}
                </Button>
                <Button variant="destructive" onClick={handleCancelSubmit} disabled={!cancelReason.trim()}>
                  <XCircle className="h-4 w-4 me-2" />
                  {isAr ? 'تأكيد الإلغاء' : 'Confirm Cancellation'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendLesson;
