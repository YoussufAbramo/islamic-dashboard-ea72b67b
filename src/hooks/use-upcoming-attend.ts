import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { differenceInMinutes } from 'date-fns';
import { useNavigate } from 'react-router-dom';

/**
 * Polls for upcoming timetable entries (within 15 min) and sets
 * pendingAttend in SessionContext so the TopBar button appears globally.
 * Runs on ALL dashboard pages.
 */
export const useUpcomingAttend = () => {
  const { user } = useAuth();
  const { activeSessionId, setPendingAttend } = useSession();
  const navigate = useNavigate();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user || activeSessionId) {
      // If there's an active session, don't show "pending attend"
      setPendingAttend(null);
      return;
    }

    const check = async () => {
      const now = new Date();
      const windowEnd = new Date(now.getTime() + 15 * 60 * 1000); // 15 min ahead

      const { data: entries } = await supabase
        .from('timetable_entries')
        .select('id, scheduled_at, duration_minutes, status, course_id, student_id, teacher_id, courses:course_id(title), students:student_id(id, user_id, profiles:students_user_id_profiles_fkey(full_name))')
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', windowEnd.toISOString())
        .in('status', ['scheduled'])
        .order('scheduled_at', { ascending: true })
        .limit(1);

      if (entries && entries.length > 0) {
        const entry = entries[0] as any;
        const scheduledTime = new Date(entry.scheduled_at);
        const minutesUntil = differenceInMinutes(scheduledTime, now);

        if (minutesUntil <= 15) {
          setPendingAttend({
            id: entry.id,
            courseTitle: entry.courses?.title || '-',
            studentName: entry.students?.profiles?.full_name || '-',
            scheduledAt: entry.scheduled_at,
            onAttend: () => navigate('/dashboard/attend-lesson'),
          });
          return;
        }
      }

      // Also check entries that already started but haven't ended
      const { data: liveEntries } = await supabase
        .from('timetable_entries')
        .select('id, scheduled_at, duration_minutes, status, course_id, student_id, teacher_id, courses:course_id(title), students:student_id(id, user_id, profiles:students_user_id_profiles_fkey(full_name))')
        .lte('scheduled_at', now.toISOString())
        .in('status', ['scheduled'])
        .order('scheduled_at', { ascending: true })
        .limit(5);

      if (liveEntries && liveEntries.length > 0) {
        for (const entry of liveEntries as any[]) {
          const scheduledTime = new Date(entry.scheduled_at);
          const endTime = new Date(scheduledTime.getTime() + entry.duration_minutes * 60000);
          if (now <= endTime) {
            setPendingAttend({
              id: entry.id,
              courseTitle: entry.courses?.title || '-',
              studentName: entry.students?.profiles?.full_name || '-',
              scheduledAt: entry.scheduled_at,
              onAttend: () => navigate('/dashboard/attend-lesson'),
            });
            return;
          }
        }
      }

      setPendingAttend(null);
    };

    check();
    intervalRef.current = setInterval(check, 30000); // Check every 30 seconds

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, activeSessionId, setPendingAttend, navigate]);
};
