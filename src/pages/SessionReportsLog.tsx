import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import ActionButton from '@/components/ui/action-button';
import { FileText, Clock, Eye, User, BookOpen, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
  student_id: string | null;
  teacher_id: string | null;
  course_id: string | null;
  subscription_id: string | null;
  student_name?: string;
  teacher_name?: string;
  course_title?: string;
}

const PAGE_SIZE = 15;

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
};

const SessionReportsLog = () => {
  const { role, user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [reports, setReports] = useState<SessionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailReport, setDetailReport] = useState<SessionReport | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchReports = async () => {
      setLoading(true);

      // Build query with role-based filtering
      let query = supabase
        .from('session_reports')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      // RLS handles filtering, but we can be explicit for student/teacher
      if (role === 'student') {
        const { data: studentRec } = await supabase.from('students').select('id').eq('user_id', user.id).single();
        if (studentRec) query = query.eq('student_id', studentRec.id);
      } else if (role === 'teacher') {
        const { data: teacherRec } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
        if (teacherRec) query = query.eq('teacher_id', teacherRec.id);
      }

      const { data, count } = await query;
      setTotalCount(count || 0);

      if (data && data.length > 0) {
        const studentIds = [...new Set(data.filter(r => r.student_id).map(r => r.student_id!))];
        const teacherIds = [...new Set(data.filter(r => r.teacher_id).map(r => r.teacher_id!))];
        const courseIds = [...new Set(data.filter(r => r.course_id).map(r => r.course_id!))];

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

        setReports(data.map(r => ({
          ...r,
          student_name: studentMap[r.student_id || ''] || '-',
          teacher_name: teacherMap[r.teacher_id || ''] || '-',
          course_title: courseMap[r.course_id || ''] || '-',
        })));
      } else {
        setReports([]);
      }
      setLoading(false);
    };
    fetchReports();
  }, [user, role, page]);

  const filtered = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter(r =>
      r.student_name?.toLowerCase().includes(q) ||
      r.teacher_name?.toLowerCase().includes(q) ||
      r.course_title?.toLowerCase().includes(q) ||
      r.summary?.toLowerCase().includes(q)
    );
  }, [reports, search]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'سجل تقارير الجلسات' : 'Session Reports Log'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'عرض شامل لجميع تقارير الجلسات المكتملة' : 'Centralized view of all completed session reports'}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isAr ? 'بحث...' : 'Search...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{totalCount}</p>
          <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي التقارير' : 'Total Reports'}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">
            {reports.length > 0 ? formatDuration(Math.round(reports.reduce((s, r) => s + r.session_duration_seconds, 0) / reports.length)) : '0m'}
          </p>
          <p className="text-xs text-muted-foreground">{isAr ? 'متوسط المدة' : 'Avg Duration'}</p>
        </CardContent></Card>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">{isAr ? 'لا توجد تقارير جلسات' : 'No session reports found'}</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? 'التاريخ والوقت' : 'Date & Time'}</TableHead>
                {role !== 'student' && <TableHead>{isAr ? 'الطالب' : 'Student'}</TableHead>}
                {role !== 'teacher' && <TableHead>{isAr ? 'المعلم' : 'Teacher'}</TableHead>}
                <TableHead>{isAr ? 'الدورة' : 'Course'}</TableHead>
                <TableHead>{isAr ? 'المدة' : 'Duration'}</TableHead>
                <TableHead>{isAr ? 'الملخص' : 'Summary'}</TableHead>
                <TableHead className="w-[60px]">{isAr ? 'عرض' : 'View'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(report => (
                <TableRow key={report.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{format(new Date(report.started_at), 'MMM d, yyyy')}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(report.started_at), 'h:mm a')}</p>
                  </TableCell>
                  {role !== 'student' && (
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm">{report.student_name}</span>
                      </div>
                    </TableCell>
                  )}
                  {role !== 'teacher' && (
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm">{report.teacher_name}</span>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate max-w-[140px]">{report.course_title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1 text-[10px]">
                      <Clock className="h-3 w-3" />
                      {formatDuration(report.session_duration_seconds)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{report.summary || '-'}</p>
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
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

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
    </div>
  );
};

export default SessionReportsLog;
