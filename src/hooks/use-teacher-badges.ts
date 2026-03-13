import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'black';
export type BadgeCategory = 'hours' | 'sessions' | 'membership' | 'certificates';

export interface BadgeMilestone {
  tier: BadgeTier;
  threshold: number;
  earned: boolean;
}

export interface BadgeCategoryData {
  category: BadgeCategory;
  currentValue: number;
  milestones: BadgeMilestone[];
  highestEarned: BadgeTier | null;
  totalEarned: number;
}

const TIER_ORDER: BadgeTier[] = ['bronze', 'silver', 'gold', 'platinum', 'black'];

const THRESHOLDS: Record<BadgeCategory, number[]> = {
  hours: [200, 500, 800, 1000, 1500],
  sessions: [100, 300, 600, 1000, 1500],
  membership: [1, 2, 3, 4, 5],
  certificates: [1, 2, 3, 4, 5],
};

export function useTeacherBadges(teacherId: string | undefined, userId: string | undefined) {
  const [totalHours, setTotalHours] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [membershipYears, setMembershipYears] = useState(0);
  const [certificateCount, setCertificateCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId || !userId) return;

    const fetchAll = async () => {
      setLoading(true);

      // All-time logged hours from session_reports
      const { data: reports } = await supabase
        .from('session_reports')
        .select('session_duration_seconds')
        .eq('teacher_id', teacherId);
      const totalSecs = (reports || []).reduce((s, r) => s + (r.session_duration_seconds || 0), 0);
      setTotalHours(totalSecs / 3600);

      // All-time completed sessions from timetable_entries
      const { count: sessCount } = await supabase
        .from('timetable_entries')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', teacherId)
        .eq('status', 'completed');
      setTotalSessions(sessCount || 0);

      // Membership years from profile created_at
      const { data: profileData } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', userId)
        .single();
      if (profileData?.created_at) {
        const years = (Date.now() - new Date(profileData.created_at).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        setMembershipYears(Math.floor(years));
      }

      // Certificates issued to this user
      const { count: certCount } = await supabase
        .from('certificates')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('status', 'active');
      setCertificateCount(certCount || 0);

      setLoading(false);
    };

    fetchAll();
  }, [teacherId, userId]);

  const categories: BadgeCategoryData[] = useMemo(() => {
    const values: Record<BadgeCategory, number> = {
      hours: totalHours,
      sessions: totalSessions,
      membership: membershipYears,
      certificates: certificateCount,
    };

    return (Object.keys(THRESHOLDS) as BadgeCategory[]).map(category => {
      const currentValue = values[category];
      const thresholds = THRESHOLDS[category];
      const milestones: BadgeMilestone[] = thresholds.map((threshold, i) => ({
        tier: TIER_ORDER[i],
        threshold,
        earned: currentValue >= threshold,
      }));
      const earned = milestones.filter(m => m.earned);
      return {
        category,
        currentValue,
        milestones,
        highestEarned: earned.length > 0 ? earned[earned.length - 1].tier : null,
        totalEarned: earned.length,
      };
    });
  }, [totalHours, totalSessions, membershipYears, certificateCount]);

  const totalBadgesEarned = useMemo(() =>
    categories.reduce((s, c) => s + c.totalEarned, 0), [categories]);

  return { categories, totalBadgesEarned, loading };
}

export const TIER_COLORS: Record<BadgeTier, { bg: string; text: string; border: string; ring: string }> = {
  bronze: { bg: 'bg-amber-700/15', text: 'text-amber-700', border: 'border-amber-700/30', ring: 'ring-amber-700/20' },
  silver: { bg: 'bg-slate-400/15', text: 'text-slate-500', border: 'border-slate-400/30', ring: 'ring-slate-400/20' },
  gold: { bg: 'bg-yellow-500/15', text: 'text-yellow-600', border: 'border-yellow-500/30', ring: 'ring-yellow-500/20' },
  platinum: { bg: 'bg-cyan-500/15', text: 'text-cyan-600', border: 'border-cyan-500/30', ring: 'ring-cyan-500/20' },
  black: { bg: 'bg-zinc-800/15', text: 'text-zinc-800 dark:text-zinc-200', border: 'border-zinc-800/30', ring: 'ring-zinc-800/20' },
};

export const TIER_LABELS: Record<BadgeTier, { en: string; ar: string }> = {
  bronze: { en: 'Bronze', ar: 'برونزي' },
  silver: { en: 'Silver', ar: 'فضي' },
  gold: { en: 'Gold', ar: 'ذهبي' },
  platinum: { en: 'Platinum', ar: 'بلاتيني' },
  black: { en: 'Black', ar: 'أسود' },
};

export const CATEGORY_LABELS: Record<BadgeCategory, { en: string; ar: string; icon: string; unit_en: string; unit_ar: string }> = {
  hours: { en: 'Logged Hours', ar: 'ساعات التدريس', icon: 'clock', unit_en: 'hours', unit_ar: 'ساعة' },
  sessions: { en: 'Completed Sessions', ar: 'الحصص المكتملة', icon: 'check-circle', unit_en: 'sessions', unit_ar: 'حصة' },
  membership: { en: 'Membership', ar: 'مدة العضوية', icon: 'calendar-days', unit_en: 'years', unit_ar: 'سنة' },
  certificates: { en: 'Certificates', ar: 'الشهادات', icon: 'award', unit_en: 'certificates', unit_ar: 'شهادة' },
};
