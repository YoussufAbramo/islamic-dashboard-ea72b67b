import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import JoinMeetingDialog from '@/components/attend/JoinMeetingDialog';
import { Card, CardContent } from '@/components/ui/card';
import { format, differenceInMinutes, isToday, isTomorrow, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { Video, Clock, MonitorPlay, AlertCircle, CalendarDays } from 'lucide-react';
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
}


const AttendLesson = () => {
  const { language } = useLanguage();
  const { role, user } = useAuth();
  const isAr = language === 'ar';
  const [entries, setEntries] = useState<LessonEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [joinOpen, setJoinOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LessonEntry | null>(null);

  // Update "now" every 30 seconds for live status updates
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchEntries = async () => {
    setLoading(true);

    // Get current week range
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
    // Extend to next week too for upcoming visibility
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

    // Get subscription URLs for each student-teacher pair
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('student_id, teacher_id, google_meet_url, zoom_url');

    const subMap = new Map<string, { google_meet_url: string; zoom_url: string }>();
    (subscriptions || []).forEach(sub => {
      const key = `${sub.student_id}|${sub.teacher_id}`;
      subMap.set(key, {
        google_meet_url: sub.google_meet_url || '',
        zoom_url: sub.zoom_url || '',
      });
    });

    const mapped: LessonEntry[] = (timetableData || []).map((e: any) => {
      const subKey = `${e.student_id}|${e.teacher_id}`;
      const urls = subMap.get(subKey) || { google_meet_url: '', zoom_url: '' };
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
      };
    });

    // Add a mock test entry (10 minutes from now) for testing
    const testTime = new Date();
    testTime.setMinutes(testTime.getMinutes() + 10);
    const mockEntry: LessonEntry = {
      id: 'mock-test-entry',
      scheduled_at: testTime.toISOString(),
      duration_minutes: 45,
      status: 'scheduled',
      course_id: null,
      student_id: null,
      teacher_id: null,
      course_title: 'Test Course',
      student_name: 'Test Student',
      teacher_name: 'Test Teacher',
      google_meet_url: 'https://meet.google.com/test-session',
      zoom_url: 'https://zoom.us/j/123456789',
    };

    setEntries([mockEntry, ...mapped]);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const getLessonStatus = (entry: LessonEntry): { label: string; variant: string; className: string; isLive: boolean } => {
    const scheduledTime = new Date(entry.scheduled_at);
    const endTime = new Date(scheduledTime.getTime() + entry.duration_minutes * 60000);
    const minutesUntil = differenceInMinutes(scheduledTime, now);

    if (entry.status === 'cancelled') {
      return { label: isAr ? 'ملغي' : 'Cancelled', variant: 'destructive', className: '', isLive: false };
    }
    if (entry.status === 'completed') {
      return { label: isAr ? 'مكتمل' : 'Completed', variant: 'secondary', className: '', isLive: false };
    }
    if (now >= scheduledTime && now <= endTime) {
      return { label: isAr ? '🔴 مباشر' : '🔴 Live', variant: 'default', className: 'bg-destructive text-destructive-foreground', isLive: true };
    }
    if (minutesUntil <= 15 && minutesUntil > 0) {
      return { label: isAr ? 'يبدأ قريباً' : 'Starting Soon', variant: 'outline', className: 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400', isLive: false };
    }
    if (now > endTime) {
      return { label: isAr ? 'انتهى' : 'Ended', variant: 'secondary', className: '', isLive: false };
    }
    return { label: isAr ? 'قادم لاحقاً' : 'Coming Later', variant: 'outline', className: 'border-primary/30 bg-primary/5 text-primary', isLive: false };
  };

  const isAttendEnabled = (entry: LessonEntry): boolean => {
    const scheduledTime = new Date(entry.scheduled_at);
    const endTime = new Date(scheduledTime.getTime() + entry.duration_minutes * 60000);
    const minutesUntil = differenceInMinutes(scheduledTime, now);
    if (entry.status === 'cancelled' || entry.status === 'completed') return false;
    // Enable 15 minutes before start until lesson ends
    return minutesUntil <= 15 && now <= endTime;
  };

  const handleAttendClick = (entry: LessonEntry) => {
    setSelectedEntry(entry);
    setJoinOpen(true);
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

  // Filter: only show upcoming (not ended/cancelled) first, then past
  const sortedEntries = useMemo(() => {
    return entries.filter(e => {
      const endTime = new Date(new Date(e.scheduled_at).getTime() + e.duration_minutes * 60000);
      // Show all non-cancelled upcoming entries, and recently ended ones
      return e.status !== 'cancelled';
    });
  }, [entries]);

  // Stats
  const liveCount = entries.filter(e => getLessonStatus(e).isLive).length;
  const todayCount = entries.filter(e => isToday(new Date(e.scheduled_at))).length;
  const weekTotal = entries.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'حضور الدرس' : 'Attend Lesson'}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr ? 'عرض وحضور الدروس المجدولة لهذا الأسبوع' : 'View and attend your scheduled lessons this week'}
          </p>
        </div>
      </div>

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

      {/* Info note */}
      <div className="flex items-start gap-2 p-3 rounded-lg border bg-muted/30">
        <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          {isAr
            ? 'زر "حضور" يتم تفعيله تلقائياً قبل 15 دقيقة من موعد الدرس ويبقى نشطاً حتى انتهاء الدرس.'
            : 'The "Attend" button activates automatically 15 minutes before the lesson starts and remains active until the lesson ends.'}
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
                  <TableHead className="text-center">{isAr ? 'إجراء' : 'Action'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEntries.map(entry => {
                  const status = getLessonStatus(entry);
                  const canAttend = isAttendEnabled(entry);

                  return (
                    <TableRow key={entry.id} className={status.isLive ? 'bg-destructive/5' : ''}>
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
                        <Badge variant={status.variant as any} className={`${status.className} ${status.isLive ? 'animate-pulse' : ''}`}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          disabled={!canAttend}
                          onClick={() => handleAttendClick(entry)}
                          className="gap-1.5"
                        >
                          <Video className="h-3.5 w-3.5" />
                          {isAr ? 'حضور' : 'Attend'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}


      {/* Join Meeting Dialog */}
      <JoinMeetingDialog
        open={joinOpen}
        onOpenChange={setJoinOpen}
        entry={selectedEntry}
        isAr={isAr}
      />
    </div>
  );
};

export default AttendLesson;
