import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Clock } from 'lucide-react';

interface SessionReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAr: boolean;
  sessionData: {
    timetableEntryId: string;
    teacherId: string | null;
    studentId: string | null;
    courseId: string | null;
    durationSeconds: number;
    startedAt: string;
  } | null;
  onReportSubmitted: () => void;
}

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const SessionReportDialog = ({ open, onOpenChange, isAr, sessionData, onReportSubmitted }: SessionReportDialogProps) => {
  const [summary, setSummary] = useState('');
  const [observations, setObservations] = useState('');
  const [performanceRemarks, setPerformanceRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!sessionData) return;
    if (!summary.trim()) {
      toast.error(isAr ? 'يرجى كتابة ملخص الجلسة' : 'Please write a session summary');
      return;
    }

    setSubmitting(true);

    // Find subscription_id for this student-teacher-course combo
    let subscriptionId: string | null = null;
    if (sessionData.studentId && sessionData.courseId) {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('student_id', sessionData.studentId)
        .eq('course_id', sessionData.courseId)
        .eq('status', 'active')
        .limit(1)
        .single();
      subscriptionId = subData?.id || null;
    }

    const { error } = await supabase.from('session_reports' as any).insert({
      timetable_entry_id: sessionData.timetableEntryId,
      teacher_id: sessionData.teacherId,
      student_id: sessionData.studentId,
      course_id: sessionData.courseId,
      subscription_id: subscriptionId,
      session_duration_seconds: sessionData.durationSeconds,
      summary: summary.trim(),
      observations: observations.trim(),
      performance_remarks: performanceRemarks.trim(),
      started_at: sessionData.startedAt,
      ended_at: new Date().toISOString(),
      created_by: (await supabase.auth.getUser()).data.user?.id || null,
    } as any);

    setSubmitting(false);

    if (error) {
      toast.error(isAr ? 'فشل حفظ التقرير' : 'Failed to save report');
      console.error('Session report error:', error);
    } else {
      toast.success(isAr ? 'تم حفظ تقرير الجلسة بنجاح' : 'Session report saved successfully');
      setSummary('');
      setObservations('');
      setPerformanceRemarks('');
      onOpenChange(false);
      onReportSubmitted();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isAr ? 'تقرير الجلسة' : 'Session Report'}
          </DialogTitle>
        </DialogHeader>

        {sessionData && (
          <div className="space-y-4">
            {/* Session Duration Display */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? 'مدة الجلسة' : 'Session Duration'}</p>
                <p className="text-lg font-bold font-mono text-primary">{formatDuration(sessionData.durationSeconds)}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                {isAr ? 'ملخص الجلسة' : 'Session Summary'} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder={isAr ? 'اكتب ملخصاً عن ما تم تغطيته في الجلسة...' : 'Write a summary of what was covered in the session...'}
                rows={3}
              />
            </div>

            {/* Observations */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">{isAr ? 'الملاحظات' : 'Observations'}</Label>
              <Textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder={isAr ? 'ملاحظات أو تعليقات حول الجلسة...' : 'Observations or feedback about the session...'}
                rows={2}
              />
            </div>

            {/* Performance Remarks */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">{isAr ? 'ملاحظات الأداء' : 'Performance Remarks'}</Label>
              <Textarea
                value={performanceRemarks}
                onChange={(e) => setPerformanceRemarks(e.target.value)}
                placeholder={isAr ? 'ملاحظات حول أداء الطالب...' : 'Remarks about the student performance...'}
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            <FileText className="h-4 w-4 me-2" />
            {submitting ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التقرير' : 'Save Report')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionReportDialog;
