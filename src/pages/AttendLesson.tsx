import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { format, differenceInMinutes, isToday, isTomorrow, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { Video, Clock, MonitorPlay, AlertCircle, CalendarDays, FileText, CheckCircle2, XCircle, FlaskConical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/PageSkeleton';
import EmptyState from '@/components/EmptyState';

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

const AttendLesson = () => {
  const { language } = useLanguage();
  const { role, user } = useAuth();
  const { activeSessionId, startSession, clearSession, setPendingAttend } = useSession();
  const isAr = language === 'ar';
  const [entries, setEntries] = useState<LessonEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [testMode, setTestMode] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LessonEntry | null>(null);

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
    if (entryIds.length > 0) {
      const { data: reports } = await supabase
        .from('session_reports' as any)
        .select('timetable_entry_id')
        .in('timetable_entry_id', entryIds);
      if (reports) {
        reportedIds = new Set((reports as any[]).map((r: any) => r.timetable_entry_id));
      }
    }
    setReportedEntryIds(reportedIds);

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

    // Active session
    if (activeSessionId === entry.id) {
      return { label: isAr ? '🟢 جلسة نشطة' : '🟢 In Session', variant: 'default', className: 'bg-emerald-600 text-white', isLive: true };
    }
    // DB-driven statuses
    if (entry.status === 'teacher_not_attend') {
      return { label: isAr ? 'لم يحضر المعلم' : 'Teacher Not Attend', variant: 'destructive', className: '', isLive: false };
    }
    if (entry.status === 'student_not_attend') {
      return { label: isAr ? 'لم يحضر الطالب' : 'Student Not Attend', variant: 'destructive', className: '', isLive: false };
    }
    if (entry.status === 'postponed') {
      return { label: isAr ? 'مؤجل' : 'Postponed', variant: 'outline', className: 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400', isLive: false };
    }
    // Ended: completed, has report, or time passed
    if (entry.status === 'completed' || entry.has_report) {
      return { label: isAr ? 'انتهى' : 'Ended', variant: 'secondary', className: '', isLive: false };
    }
    if (now > endTime) {
      return { label: isAr ? 'انتهى' : 'Ended', variant: 'secondary', className: '', isLive: false };
    }
    // In Session (live window)
    if (now >= scheduledTime && now <= endTime) {
      return { label: isAr ? '🔴 جلسة جارية' : '🔴 In Session', variant: 'default', className: 'bg-destructive text-destructive-foreground', isLive: true };
    }
    // Upcoming
    return { label: isAr ? 'قادم' : 'Upcoming', variant: 'outline', className: 'border-primary/30 bg-primary/5 text-primary', isLive: false };
  };

  // In test mode, the first non-completed/cancelled entry has all restrictions lifted
  const testEntryId = testMode ? entries.find(e => e.status !== 'cancelled' && e.status !== 'completed' && !e.has_report && !reportedEntryIds.has(e.id))?.id : null;

  const isAttendEnabled = (entry: LessonEntry): boolean => {
    if (activeSessionId) return false;
    if (entry.has_report || reportedEntryIds.has(entry.id)) return false;
    if (entry.status === 'cancelled' || entry.status === 'completed') return false;
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
    if (entry.status === 'cancelled' || entry.status === 'completed') return false;
    if (testMode && entry.id === testEntryId) return true;
    const scheduledTime = new Date(entry.scheduled_at);
    const minutesUntil = differenceInMinutes(scheduledTime, now);
    return minutesUntil > 30;
  };

  const isNotAttendVisible = (entry: LessonEntry): boolean => {
    if (activeSessionId === entry.id) return false;
    if (entry.has_report || reportedEntryIds.has(entry.id)) return false;
    if (entry.status === 'cancelled' || entry.status === 'completed') return false;
    const scheduledTime = new Date(entry.scheduled_at);
    const endTime = new Date(scheduledTime.getTime() + entry.duration_minutes * 60000);
    // Show only for future entries
    return now < endTime;
  };

  const handleNotAttend = async (entry: LessonEntry) => {
    const { error } = await supabase
      .from('timetable_entries')
      .update({ status: 'cancelled' })
      .eq('id', entry.id);
    if (error) {
      toast.error(isAr ? 'فشل تحديث الحالة' : 'Failed to update status');
      return;
    }
    toast.success(isAr ? 'تم تسجيل عدم الحضور' : 'Marked as not attending');
    fetchEntries();
  };

  const handleAttendClick = (entry: LessonEntry) => {
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
    clearSession();
    setReportSessionData(null);
    fetchEntries();
  }, [activeSessionId, clearSession]);

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
    return entries.filter(e => e.status !== 'cancelled');
  }, [entries]);

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
          <h1 className="text-2xl font-bold">{isAr ? 'حضور الدرس' : 'Attend Lesson'}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr ? 'عرض وحضور الدروس المجدولة لهذا الأسبوع' : 'View and attend your scheduled lessons this week'}
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
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            {isAr
              ? 'زر "حضور" يتم تفعيله تلقائياً قبل 15 دقيقة من موعد الدرس. عند الانضمام يبدأ مؤقت الجلسة ويجب إنهاء الجلسة وكتابة تقرير.'
              : 'The "Attend" button activates 15 minutes before the lesson. Joining starts a session timer — end the session to submit a report.'}
          </p>
          <p>
            {isAr
              ? 'خيار "عدم الحضور" متاح حتى 30 دقيقة قبل موعد الدرس. خلال آخر 30 دقيقة، لا يمكن إلغاء الحضور. لمزيد من التفاصيل، راجع '
              : 'The "Not Attend" option is available up to 30 minutes before the lesson. Within the last 30 minutes, cancellation is not allowed. For more details, see the '}
            <a href="/policies/attendance-policy" target="_blank" className="text-primary underline underline-offset-2 hover:text-primary/80">
              {isAr ? 'سياسة الحضور' : 'Attendance Policy'}
            </a>.
          </p>
        </div>
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

                  return (
                    <TableRow key={entry.id} className={isActiveEntry ? 'bg-emerald-500/5' : status.isLive ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{formatDate(entry.scheduled_at)}</p>
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
                        <Badge variant={status.variant as any} className={`${status.className} ${status.isLive && !isActiveEntry ? 'animate-pulse' : ''}`}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {hasReport ? (
                          <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]">
                            <CheckCircle2 className="h-3 w-3" />
                            {isAr ? 'مكتمل' : 'Done'}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">{isAr ? 'لا يوجد' : 'None'}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isActiveEntry ? (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              {isAr ? 'جلسة نشطة...' : 'In session...'}
                            </span>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                disabled={!canAttend}
                                onClick={() => handleAttendClick(entry)}
                                className="gap-1.5"
                              >
                                <Video className="h-3.5 w-3.5" />
                                {isAr ? 'حضور' : 'Attend'}
                              </Button>
                              {showNotAttend && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={!canNotAttend}
                                  onClick={() => handleNotAttend(entry)}
                                  className="gap-1 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  {isAr ? 'عدم الحضور' : 'Not Attend'}
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
        isAr={isAr}
        onSessionStart={() => {
          if (selectedEntry) {
            handleSessionStart(selectedEntry.id);
          }
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
    </div>
  );
};

export default AttendLesson;
