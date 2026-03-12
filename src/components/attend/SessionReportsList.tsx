import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Clock, Eye, User, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

interface SessionReport {
  id: string;
  timetable_entry_id: string;
  session_duration_seconds: number;
  summary: string;
  observations: string;
  performance_remarks: string;
  started_at: string;
  ended_at: string;
  created_at: string;
  student_name?: string;
  teacher_name?: string;
  course_title?: string;
}

interface SessionReportsListProps {
  isAr: boolean;
  /** Filter by specific IDs */
  studentId?: string;
  teacherId?: string;
  courseId?: string;
  subscriptionId?: string;
  timetableEntryId?: string;
  /** Maximum rows to show (default: all) */
  limit?: number;
}

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
};

const SessionReportsList = ({ isAr, studentId, teacherId, courseId, subscriptionId, timetableEntryId, limit }: SessionReportsListProps) => {
  const [reports, setReports] = useState<SessionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailReport, setDetailReport] = useState<SessionReport | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      let query = supabase
        .from('session_reports' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (studentId) query = query.eq('student_id', studentId);
      if (teacherId) query = query.eq('teacher_id', teacherId);
      if (courseId) query = query.eq('course_id', courseId);
      if (subscriptionId) query = query.eq('subscription_id', subscriptionId);
      if (timetableEntryId) query = query.eq('timetable_entry_id', timetableEntryId);
      if (limit) query = query.limit(limit);

      const { data } = await query;
      
      if (data && (data as any[]).length > 0) {
        // Fetch related names
        const studentIds = [...new Set((data as any[]).filter(r => r.student_id).map(r => r.student_id))];
        const teacherIds = [...new Set((data as any[]).filter(r => r.teacher_id).map(r => r.teacher_id))];
        const courseIds = [...new Set((data as any[]).filter(r => r.course_id).map(r => r.course_id))];

        const [studentsRes, teachersRes, coursesRes] = await Promise.all([
          studentIds.length > 0 ? supabase.from('students').select('id, profiles:students_user_id_profiles_fkey(full_name)').in('id', studentIds) : { data: [] },
          teacherIds.length > 0 ? supabase.from('teachers').select('id, profiles:teachers_user_id_profiles_fkey(full_name)').in('id', teacherIds) : { data: [] },
          courseIds.length > 0 ? supabase.from('courses').select('id, title').in('id', courseIds) : { data: [] },
        ]);

        const studentMap: Record<string, string> = {};
        (studentsRes.data || []).forEach((s: any) => { studentMap[s.id] = s.profiles?.full_name || '-'; });
        const teacherMap: Record<string, string> = {};
        (teachersRes.data || []).forEach((t: any) => { teacherMap[t.id] = t.profiles?.full_name || '-'; });
        const courseMap: Record<string, string> = {};
        (coursesRes.data || []).forEach((c: any) => { courseMap[c.id] = c.title || '-'; });

        setReports((data as any[]).map(r => ({
          ...r,
          student_name: studentMap[r.student_id] || '-',
          teacher_name: teacherMap[r.teacher_id] || '-',
          course_title: courseMap[r.course_id] || '-',
        })));
      } else {
        setReports([]);
      }
      setLoading(false);
    };
    fetchReports();
  }, [studentId, teacherId, courseId, subscriptionId, timetableEntryId, limit]);

  if (loading) {
    return <p className="text-sm text-muted-foreground py-4 text-center">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>;
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 space-y-2">
        <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto" />
        <p className="text-sm text-muted-foreground">{isAr ? 'لا توجد تقارير جلسات بعد' : 'No session reports yet'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
              {!studentId && <TableHead>{isAr ? 'الطالب' : 'Student'}</TableHead>}
              {!teacherId && <TableHead>{isAr ? 'المعلم' : 'Teacher'}</TableHead>}
              {!courseId && <TableHead>{isAr ? 'الدورة' : 'Course'}</TableHead>}
              <TableHead>{isAr ? 'المدة' : 'Duration'}</TableHead>
              <TableHead>{isAr ? 'الملخص' : 'Summary'}</TableHead>
              <TableHead>{isAr ? 'عرض' : 'View'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map(report => (
              <TableRow key={report.id}>
                <TableCell>
                  <p className="text-sm">{format(new Date(report.started_at), 'MMM d, yyyy')}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(report.started_at), 'h:mm a')}</p>
                </TableCell>
                {!studentId && <TableCell className="text-sm">{report.student_name}</TableCell>}
                {!teacherId && <TableCell className="text-sm">{report.teacher_name}</TableCell>}
                {!courseId && <TableCell className="text-sm">{report.course_title}</TableCell>}
                <TableCell>
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <Clock className="h-3 w-3" />
                    {formatDuration(report.session_duration_seconds)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{report.summary || '-'}</p>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailReport(report)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailReport} onOpenChange={(val) => !val && setDetailReport(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {isAr ? 'تفاصيل تقرير الجلسة' : 'Session Report Details'}
            </DialogTitle>
          </DialogHeader>
          {detailReport && (
            <div className="space-y-4">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-card">
                  <Clock className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">{isAr ? 'المدة' : 'Duration'}</p>
                    <p className="text-sm font-semibold">{formatDuration(detailReport.session_duration_seconds)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-card">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">{isAr ? 'الدورة' : 'Course'}</p>
                    <p className="text-sm font-semibold truncate">{detailReport.course_title}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-card">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">{isAr ? 'الطالب' : 'Student'}</p>
                    <p className="text-sm font-medium">{detailReport.student_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-card">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">{isAr ? 'المعلم' : 'Teacher'}</p>
                    <p className="text-sm font-medium">{detailReport.teacher_name}</p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                {format(new Date(detailReport.started_at), 'MMM d, yyyy — h:mm a')} → {format(new Date(detailReport.ended_at), 'h:mm a')}
              </div>

              {/* Report Fields */}
              {detailReport.summary && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">{isAr ? 'الملخص' : 'Summary'}</p>
                  <p className="text-sm bg-muted/50 p-2.5 rounded-lg">{detailReport.summary}</p>
                </div>
              )}
              {detailReport.observations && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">{isAr ? 'الملاحظات' : 'Observations'}</p>
                  <p className="text-sm bg-muted/50 p-2.5 rounded-lg">{detailReport.observations}</p>
                </div>
              )}
              {detailReport.performance_remarks && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">{isAr ? 'ملاحظات الأداء' : 'Performance Remarks'}</p>
                  <p className="text-sm bg-muted/50 p-2.5 rounded-lg">{detailReport.performance_remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SessionReportsList;
