// Centralized status label maps for human-readable display across pages

export const subscriptionStatusLabels: Record<string, { en: string; ar: string }> = {
  active: { en: 'Active', ar: 'نشط' },
  expired: { en: 'Expired', ar: 'منتهي' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
};

export const subscriptionTypeLabels: Record<string, { en: string; ar: string }> = {
  monthly: { en: 'Monthly', ar: 'شهري' },
  quarterly: { en: '3-Month', ar: '3 أشهر' },
  yearly: { en: 'Yearly', ar: 'سنوي' },
};

export const ticketStatusLabels: Record<string, { en: string; ar: string }> = {
  open: { en: 'Open', ar: 'مفتوحة' },
  in_progress: { en: 'In Progress', ar: 'قيد المعالجة' },
  resolved: { en: 'Resolved', ar: 'تم الحل' },
  closed: { en: 'Closed', ar: 'مغلقة' },
};

export const ticketPriorityLabels: Record<string, { en: string; ar: string }> = {
  low: { en: 'Low', ar: 'منخفضة' },
  medium: { en: 'Medium', ar: 'متوسطة' },
  high: { en: 'High', ar: 'عالية' },
  urgent: { en: 'Urgent', ar: 'عاجلة' },
};

export const courseStatusLabels: Record<string, { en: string; ar: string }> = {
  draft: { en: 'Draft', ar: 'مسودة' },
  published: { en: 'Published', ar: 'منشور' },
  archived: { en: 'Archived', ar: 'مؤرشف' },
};

export const timetableStatusLabels: Record<string, { en: string; ar: string }> = {
  scheduled: { en: 'Upcoming', ar: 'قادم' },
  completed: { en: 'Ended', ar: 'انتهى' },
  teacher_not_attend: { en: 'Not Attended', ar: 'لم يحضر' },
  student_not_attend: { en: 'Not Attended', ar: 'لم يحضر' },
  not_attend: { en: 'Not Attended', ar: 'لم يحضر' },
  postponed: { en: 'Postponed', ar: 'مؤجل' },
};

export const certificateStatusLabels: Record<string, { en: string; ar: string }> = {
  active: { en: 'Active', ar: 'نشطة' },
  revoked: { en: 'Revoked', ar: 'ملغاة' },
};

export const getLabel = (map: Record<string, { en: string; ar: string }>, key: string, isAr: boolean): string => {
  const entry = map[key];
  return entry ? (isAr ? entry.ar : entry.en) : key;
};
