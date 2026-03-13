import { Clock, CheckCircle, CalendarDays, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  BadgeCategoryData, BadgeCategory, BadgeTier,
  TIER_COLORS, TIER_LABELS, CATEGORY_LABELS,
} from '@/hooks/use-teacher-badges';

const CATEGORY_ICONS: Record<BadgeCategory, React.ElementType> = {
  hours: Clock,
  sessions: CheckCircle,
  membership: CalendarDays,
  certificates: Award,
};

/* ═══════════════════════════════════════════════
   A. Badge Summary Cards — placed as a section
   ═══════════════════════════════════════════════ */

export function BadgeSummaryCards({ categories, isAr }: { categories: BadgeCategoryData[]; isAr: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          {isAr ? 'ملخص الإنجازات' : 'Achievements Summary'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {categories.map(cat => (
            <BadgeSummaryCard key={cat.category} data={cat} isAr={isAr} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const CARD_ACCENTS: Record<BadgeCategory, { gradient: string; iconBg: string; iconText: string }> = {
  hours: { gradient: 'from-blue-500/10 to-blue-600/5 dark:from-blue-500/15 dark:to-blue-600/10', iconBg: 'bg-blue-500/15 dark:bg-blue-500/25', iconText: 'text-blue-600 dark:text-blue-400' },
  sessions: { gradient: 'from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/15 dark:to-emerald-600/10', iconBg: 'bg-emerald-500/15 dark:bg-emerald-500/25', iconText: 'text-emerald-600 dark:text-emerald-400' },
  membership: { gradient: 'from-violet-500/10 to-violet-600/5 dark:from-violet-500/15 dark:to-violet-600/10', iconBg: 'bg-violet-500/15 dark:bg-violet-500/25', iconText: 'text-violet-600 dark:text-violet-400' },
  certificates: { gradient: 'from-amber-500/10 to-amber-600/5 dark:from-amber-500/15 dark:to-amber-600/10', iconBg: 'bg-amber-500/15 dark:bg-amber-500/25', iconText: 'text-amber-600 dark:text-amber-400' },
};

function BadgeSummaryCard({ data, isAr }: { data: BadgeCategoryData; isAr: boolean }) {
  const catMeta = CATEGORY_LABELS[data.category];
  const Icon = CATEGORY_ICONS[data.category];
  const tierColors = data.highestEarned ? TIER_COLORS[data.highestEarned] : null;
  const tierLabel = data.highestEarned ? TIER_LABELS[data.highestEarned] : null;
  const accent = CARD_ACCENTS[data.category];

  // Progress: each earned badge = one segment, plus partial progress within next segment
  const totalMilestones = data.milestones.length;
  const segmentSize = 100 / totalMilestones;
  const nextMilestone = data.milestones.find(m => !m.earned);
  const prevThreshold = data.totalEarned > 0 ? data.milestones[data.totalEarned - 1].threshold : 0;
  const nextThreshold = nextMilestone?.threshold || prevThreshold;
  const range = nextThreshold - prevThreshold;
  const intraProgress = nextMilestone && range > 0
    ? Math.min(1, Math.max(0, (data.currentValue - prevThreshold) / range))
    : 0;
  const progressPercent = nextMilestone
    ? Math.min(100, Math.round((data.totalEarned + intraProgress) * segmentSize))
    : 100;

  return (
    <div className={`rounded-xl border p-4 space-y-3 transition-shadow hover:shadow-md bg-gradient-to-br ${accent.gradient}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`rounded-lg p-1.5 ${accent.iconBg}`}>
            <Icon className={`h-4 w-4 ${accent.iconText}`} />
          </div>
          <span className="text-xs font-semibold">{isAr ? catMeta.ar : catMeta.en}</span>
        </div>
        {tierLabel && (
          <Badge variant="outline" className={`text-[10px] px-1.5 ${tierColors!.border} ${tierColors!.text}`}>
            {isAr ? tierLabel.ar : tierLabel.en}
          </Badge>
        )}
      </div>

      <div>
        <p className="text-xl font-bold">
          {data.category === 'hours' ? data.currentValue.toFixed(0) : data.currentValue}
          <span className="text-xs font-normal text-muted-foreground ms-1">
            {isAr ? catMeta.unit_ar : catMeta.unit_en}
          </span>
        </p>
      </div>

      {/* Progress bar to next tier */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{data.totalEarned}/{data.milestones.length} {isAr ? 'أوسمة' : 'badges'}</span>
          {nextMilestone && (
            <span>{isAr ? 'التالي' : 'Next'}: {nextMilestone.threshold} {isAr ? catMeta.unit_ar : catMeta.unit_en}</span>
          )}
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   B. Badge Icons Row — for Personal Info section
   ═══════════════════════════════════════════════ */

export function BadgeIconsRow({ categories, isAr }: { categories: BadgeCategoryData[]; isAr: boolean }) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-2 gap-2">
        {categories.map(cat => (
          <BadgeCategoryRow key={cat.category} data={cat} isAr={isAr} />
        ))}
      </div>
    </TooltipProvider>
  );
}

function BadgeCategoryRow({ data, isAr }: { data: BadgeCategoryData; isAr: boolean }) {
  const catMeta = CATEGORY_LABELS[data.category];
  const Icon = CATEGORY_ICONS[data.category];

  return (
    <div className="rounded-lg border bg-muted/30 p-2.5 space-y-2">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-[10px] font-semibold text-muted-foreground truncate">
          {isAr ? catMeta.ar : catMeta.en}
        </span>
        <span className="text-[9px] text-muted-foreground/60 ms-auto shrink-0">
          {data.totalEarned}/{data.milestones.length}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {data.milestones.map(m => (
          <TierBadgeIcon key={m.tier} milestone={m} category={data.category} isAr={isAr} />
        ))}
      </div>
    </div>
  );
}

function TierBadgeIcon({ milestone, category, isAr }: { milestone: { tier: BadgeTier; threshold: number; earned: boolean }; category: BadgeCategory; isAr: boolean }) {
  const colors = TIER_COLORS[milestone.tier];
  const tierLabel = TIER_LABELS[milestone.tier];
  const catMeta = CATEGORY_LABELS[category];

  const tooltipText = milestone.earned
    ? `${isAr ? tierLabel.ar : tierLabel.en} — ${milestone.threshold} ${isAr ? catMeta.unit_ar : catMeta.unit_en} ✓`
    : `${isAr ? tierLabel.ar : tierLabel.en} — ${isAr ? 'يتطلب' : 'Requires'} ${milestone.threshold} ${isAr ? catMeta.unit_ar : catMeta.unit_en}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`
            flex items-center justify-center w-7 h-7 rounded-full border-2 text-[9px] font-bold transition-all cursor-default
            ${milestone.earned
              ? `${colors.bg} ${colors.text} ${colors.border} ring-1 ${colors.ring}`
              : 'bg-muted/50 text-muted-foreground/40 border-muted-foreground/10 grayscale opacity-40'
            }
          `}
        >
          {milestone.tier.charAt(0).toUpperCase()}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[180px]">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}
