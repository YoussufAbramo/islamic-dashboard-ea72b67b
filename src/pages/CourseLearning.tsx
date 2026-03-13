import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Circle,
  BookOpen, Play, FileText, Headphones, ExternalLink, FileDown,
  Menu, X, GraduationCap, Loader2, PanelTop, PanelTopClose, AlertTriangle, Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import LessonBuilder from '@/components/course/LessonBuilder';

// ─── Types ───
interface CourseSection {
  id: string;
  title: string;
  title_ar: string | null;
  sort_order: number;
}

interface LessonSection {
  id: string;
  course_section_id: string;
  title: string;
  title_ar: string | null;
  sort_order: number;
}

interface Lesson {
  id: string;
  section_id: string;
  title: string;
  title_ar: string | null;
  lesson_type: string;
  content: any;
  sort_order: number;
}

interface ProgressRecord {
  lesson_id: string;
  completed: boolean;
}

// ─── Content type helpers ───
const getContentIcon = (type: string) => {
  if (type.includes('listen') || type === 'memorization') return Headphones;
  if (type === 'read_listen' || type === 'table_of_content') return FileText;
  if (type === 'homework') return FileDown;
  if (type.includes('exercise')) return Play;
  return BookOpen;
};

const getContentLabel = (type: string, isAr: boolean): string => {
  const map: Record<string, [string, string]> = {
    table_of_content: ['Table of Content', 'جدول المحتويات'],
    read_listen: ['Read & Listen', 'قراءة واستماع'],
    memorization: ['Memorization', 'حفظ'],
    revision: ['Revision', 'مراجعة'],
    homework: ['Homework', 'واجب'],
    exercise_text_match: ['Text Match', 'مطابقة النص'],
    exercise_choose_correct: ['Choose Correct', 'اختر الصحيح'],
    exercise_choose_multiple: ['Choose Multiple', 'اختر متعدد'],
    exercise_rearrange: ['Rearrange', 'إعادة ترتيب'],
    exercise_missing_text: ['Missing Text', 'نص ناقص'],
    exercise_true_false: ['True / False', 'صح / خطأ'],
    exercise_listen_choose: ['Listen & Choose', 'استمع واختر'],
  };
  const [en, ar] = map[type] || ['Lesson', 'درس'];
  return isAr ? ar : en;
};

// ─── Content Viewer ───
const ContentViewer = ({ lesson, isAr }: { lesson: Lesson | null; isAr: boolean }) => {
  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-2">
          <BookOpen className="h-12 w-12 mx-auto opacity-30" />
          <p className="text-sm">{isAr ? 'اختر درسًا للبدء' : 'Select a lesson to begin'}</p>
        </div>
      </div>
    );
  }

  const content = lesson.content || {};
  const Icon = getContentIcon(lesson.lesson_type);

  // ─── Block-based content (new format) ───
  if (Array.isArray(content.blocks) && content.blocks.length > 0) {
    return (
      <div className="space-y-6">
        {/* Lesson header */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold">
            {isAr && lesson.title_ar ? lesson.title_ar : lesson.title}
          </h2>
        </div>
        <Separator />

        {content.blocks.map((block: any, idx: number) => {
          switch (block.type) {
            case 'text':
              return block.html ? (
                <div key={block.id || idx} className="prose prose-sm dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: block.html }} />
                </div>
              ) : null;

            case 'image':
              return block.image_url ? (
                <figure key={block.id || idx} className="space-y-2">
                  <div className="rounded-lg overflow-hidden border bg-muted/30">
                    <img
                      src={block.image_url}
                      alt={block.image_alt || block.image_caption || ''}
                      className="w-full object-contain max-h-[500px] mx-auto"
                    />
                  </div>
                  {block.image_caption && (
                    <figcaption className="text-xs text-muted-foreground text-center">
                      {block.image_caption}
                    </figcaption>
                  )}
                </figure>
              ) : null;

            case 'video':
              return block.video_url ? (
                <div key={block.id || idx} className="space-y-2">
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted border">
                    <video src={block.video_url} controls className="w-full h-full" controlsList="nodownload" />
                  </div>
                  {block.video_caption && (
                    <p className="text-xs text-muted-foreground text-center">{block.video_caption}</p>
                  )}
                </div>
              ) : null;

            case 'audio':
              return block.audio_url ? (
                <div key={block.id || idx} className="space-y-2">
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3 mb-3">
                      <Headphones className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">
                        {block.audio_caption || (isAr ? 'مقطع صوتي' : 'Audio')}
                      </span>
                    </div>
                    <audio src={block.audio_url} controls className="w-full" />
                  </div>
                </div>
              ) : null;

            default:
              return null;
          }
        })}
      </div>
    );
  }

  // ─── Legacy flat content (backward compatible) ───
  const videoUrl = content.video_url || content.videoUrl;
  const audioUrl = content.audio_url || content.audioUrl;
  const pdfUrl = content.pdf_url || content.pdfUrl;
  const externalUrl = content.external_url || content.externalUrl || content.link;
  const textContent = content.text || content.body || content.html || content.description;
  const instructions = content.instructions;

  return (
    <div className="space-y-6">
      {/* Lesson header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] gap-1">
            <Icon className="h-3 w-3" />
            {getContentLabel(lesson.lesson_type, isAr)}
          </Badge>
        </div>
        <h2 className="text-xl font-bold">
          {isAr && lesson.title_ar ? lesson.title_ar : lesson.title}
        </h2>
      </div>

      <Separator />

      {videoUrl && (
        <div className="aspect-video rounded-lg overflow-hidden bg-muted border">
          <video src={videoUrl} controls className="w-full h-full" controlsList="nodownload" />
        </div>
      )}

      {audioUrl && (
        <div className="p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3 mb-3">
            <Headphones className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{isAr ? 'مقطع صوتي' : 'Audio Lesson'}</span>
          </div>
          <audio src={audioUrl} controls className="w-full" />
        </div>
      )}

      {pdfUrl && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileDown className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{isAr ? 'ملف PDF' : 'PDF Document'}</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 me-1.5" />
                {isAr ? 'فتح' : 'Open'}
              </a>
            </Button>
          </div>
          <div className="aspect-[3/4] max-h-[600px] rounded-lg overflow-hidden border">
            <iframe src={pdfUrl} className="w-full h-full" title="PDF Viewer" />
          </div>
        </div>
      )}

      {externalUrl && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ExternalLink className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{isAr ? 'رابط خارجي' : 'External Resource'}</p>
                <p className="text-xs text-muted-foreground truncate max-w-xs">{externalUrl}</p>
              </div>
            </div>
            <Button size="sm" asChild>
              <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                {isAr ? 'زيارة' : 'Visit'}
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {instructions && (
        <div className="p-4 rounded-lg border bg-primary/5 border-primary/20 space-y-2">
          <p className="text-xs font-semibold text-primary">{isAr ? 'التعليمات' : 'Instructions'}</p>
          <p className="text-sm whitespace-pre-wrap">{instructions}</p>
        </div>
      )}

      {textContent && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: textContent }} />
        </div>
      )}

      {!videoUrl && !audioUrl && !pdfUrl && !externalUrl && !textContent && !instructions && (
        <div className="p-6 rounded-lg border bg-muted/30 text-center space-y-2">
          <Icon className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {isAr ? 'لم يتم إضافة محتوى لهذا الدرس بعد.' : 'No content has been added to this lesson yet.'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isAr ? `نوع الدرس: ${getContentLabel(lesson.lesson_type, isAr)}` : `Lesson type: ${getContentLabel(lesson.lesson_type, isAr)}`}
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───
const CourseLearning = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, role } = useAuth();
  const { topBarHidden, setTopBarHidden } = useOutletContext<{ topBarHidden: boolean; setTopBarHidden: (v: boolean) => void }>();
  const isAr = language === 'ar';

  // Auto-hide top bar on mount, restore on unmount
  useEffect(() => {
    setTopBarHidden(true);
    return () => setTopBarHidden(false);
  }, [setTopBarHidden]);

  const [course, setCourse] = useState<any>(null);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [lessonSections, setLessonSections] = useState<LessonSection[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // collapsed by default
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const canManage = role === 'admin' || role === 'teacher';

  // Fetch everything
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);

      const [courseRes, sectionsRes] = await Promise.all([
        supabase.from('courses').select('*').eq('id', id).single(),
        supabase.from('course_sections').select('*').eq('course_id', id).order('sort_order'),
      ]);

      setCourse(courseRes.data);
      const cSections = sectionsRes.data || [];
      setCourseSections(cSections);

      if (cSections.length === 0) {
        setLoading(false);
        return;
      }

      const csIds = cSections.map(s => s.id);
      const { data: lSections } = await supabase
        .from('lesson_sections')
        .select('*')
        .in('course_section_id', csIds)
        .order('sort_order');
      setLessonSections((lSections as any[]) || []);

      const lsIds = (lSections || []).map((s: any) => s.id);
      if (lsIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .in('section_id', lsIds)
        .order('sort_order');
      setLessons(lessonsData || []);

      // Fetch user progress
      if (user) {
        const { data: studentRec } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (studentRec) {
          const lessonIds = (lessonsData || []).map(l => l.id);
          if (lessonIds.length > 0) {
            const { data: progressData } = await supabase
              .from('student_progress')
              .select('lesson_id, completed')
              .eq('student_id', studentRec.id)
              .in('lesson_id', lessonIds);
            setProgress(progressData || []);
          }
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  // All lessons in order (flattened through hierarchy)
  const orderedLessons = useMemo(() => {
    const result: Lesson[] = [];
    for (const cs of courseSections) {
      const lsForCs = lessonSections.filter(ls => ls.course_section_id === cs.id);
      for (const ls of lsForCs) {
        const lessonsForLs = lessons.filter(l => l.section_id === ls.id);
        result.push(...lessonsForLs);
      }
    }
    return result;
  }, [courseSections, lessonSections, lessons]);

  // Auto-select lesson on load
  useEffect(() => {
    if (activeLesson || orderedLessons.length === 0) return;

    // Find last completed lesson index, then open next one
    const completedIds = new Set(progress.filter(p => p.completed).map(p => p.lesson_id));
    let lastCompletedIdx = -1;
    for (let i = orderedLessons.length - 1; i >= 0; i--) {
      if (completedIds.has(orderedLessons[i].id)) {
        lastCompletedIdx = i;
        break;
      }
    }

    if (lastCompletedIdx >= 0 && lastCompletedIdx < orderedLessons.length - 1) {
      // Open next lesson after last completed
      setActiveLesson(orderedLessons[lastCompletedIdx + 1].id);
    } else if (lastCompletedIdx >= 0) {
      // All done, open last completed
      setActiveLesson(orderedLessons[lastCompletedIdx].id);
    } else {
      // No progress, open first
      setActiveLesson(orderedLessons[0].id);
    }
  }, [orderedLessons, progress, activeLesson]);

  const currentLesson = orderedLessons.find(l => l.id === activeLesson) || null;
  const currentIndex = orderedLessons.findIndex(l => l.id === activeLesson);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < orderedLessons.length - 1;

  const completedSet = useMemo(() => {
    return new Set(progress.filter(p => p.completed).map(p => p.lesson_id));
  }, [progress]);

  const progressPercent = orderedLessons.length > 0
    ? Math.round((completedSet.size / orderedLessons.length) * 100)
    : 0;

  const isCurrentCompleted = activeLesson ? completedSet.has(activeLesson) : false;

  const handleMarkComplete = useCallback(async () => {
    if (!activeLesson || !user) return;
    setMarkingComplete(true);

    try {
      const { data: studentRec } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!studentRec) {
        toast.error(isAr ? 'لم يتم العثور على سجل الطالب' : 'Student record not found');
        return;
      }

      // Check if already exists
      const { data: existing } = await supabase
        .from('student_progress')
        .select('id')
        .eq('student_id', studentRec.id)
        .eq('lesson_id', activeLesson)
        .single();

      if (existing) {
        await supabase
          .from('student_progress')
          .update({ completed: true, completed_at: new Date().toISOString(), score: 100 })
          .eq('id', existing.id);
      } else {
        await supabase.from('student_progress').insert({
          student_id: studentRec.id,
          lesson_id: activeLesson,
          completed: true,
          completed_at: new Date().toISOString(),
          score: 100,
        });
      }

      setProgress(prev => {
        const filtered = prev.filter(p => p.lesson_id !== activeLesson);
        return [...filtered, { lesson_id: activeLesson, completed: true }];
      });

      toast.success(isAr ? 'تم إكمال الدرس!' : 'Lesson completed!');

      // Auto advance to next
      if (hasNext) {
        setTimeout(() => setActiveLesson(orderedLessons[currentIndex + 1].id), 500);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setMarkingComplete(false);
    }
  }, [activeLesson, user, isAr, hasNext, currentIndex, orderedLessons]);

  const handleBuilderSaved = useCallback(async () => {
    // Re-fetch lessons to get updated content
    if (!id) return;
    const csIds = courseSections.map(s => s.id);
    if (csIds.length === 0) return;
    const { data: lSections } = await supabase.from('lesson_sections').select('*').in('course_section_id', csIds).order('sort_order');
    const lsIds = (lSections || []).map((s: any) => s.id);
    if (lsIds.length === 0) return;
    const { data: lessonsData } = await supabase.from('lessons').select('*').in('section_id', lsIds).order('sort_order');
    setLessons(lessonsData || []);
  }, [id, courseSections]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12 space-y-3">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30" />
        <p className="text-muted-foreground">{isAr ? 'الدورة غير موجودة' : 'Course not found'}</p>
        <Button variant="outline" onClick={() => navigate('/dashboard/courses')}>
          <ArrowLeft className="h-4 w-4 me-2" />{isAr ? 'العودة' : 'Go Back'}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", topBarHidden ? "h-[calc(100vh-2.5rem)]" : "h-[calc(100vh-6.5rem)]")}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setLeaveDialogOpen(true)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">
            {isAr && course.title_ar ? course.title_ar : course.title}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <Progress value={progressPercent} className="w-24 h-2" />
            <span className="text-xs font-mono text-muted-foreground">{progressPercent}%</span>
          </div>
          <Badge variant="secondary" className="text-[10px] gap-1">
            <GraduationCap className="h-3 w-3" />
            {completedSet.size}/{orderedLessons.length}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setTopBarHidden(!topBarHidden)}
            title={topBarHidden ? (isAr ? 'إظهار الشريط العلوي' : 'Show Top Bar') : (isAr ? 'إخفاء الشريط العلوي' : 'Hide Top Bar')}
          >
            {topBarHidden ? <PanelTop className="h-4 w-4" /> : <PanelTopClose className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <div className={cn(
          "border-e bg-card shrink-0 transition-all duration-200 overflow-hidden",
          sidebarOpen ? "w-72" : "w-0"
        )}>
          <ScrollArea className="h-full">
            <div className="p-3 space-y-1">
              {courseSections.map(cs => {
                const lsForCs = lessonSections.filter(ls => ls.course_section_id === cs.id);
                if (lsForCs.length === 0) return null;

                return (
                  <div key={cs.id} className="space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-3 pb-1">
                      {isAr && cs.title_ar ? cs.title_ar : cs.title}
                    </p>
                    {lsForCs.map(ls => {
                      const lessonsForLs = lessons.filter(l => l.section_id === ls.id);
                      if (lessonsForLs.length === 0) return null;
                      return (
                        <div key={ls.id} className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground/70 px-2 pt-1.5">
                            {isAr && ls.title_ar ? ls.title_ar : ls.title}
                          </p>
                          {lessonsForLs.map(lesson => {
                            const isActive = activeLesson === lesson.id;
                            const isDone = completedSet.has(lesson.id);
                            const LessonIcon = getContentIcon(lesson.lesson_type);
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => setActiveLesson(lesson.id)}
                                className={cn(
                                  "w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-start text-xs transition-colors",
                                  isActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-foreground hover:bg-muted"
                                )}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                                )}
                                <LessonIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">
                                  {isAr && lesson.title_ar ? lesson.title_ar : lesson.title}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto p-6">
              <ContentViewer lesson={currentLesson} isAr={isAr} />
            </div>
          </ScrollArea>

          {/* Bottom navigation */}
          {orderedLessons.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-card shrink-0">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasPrev}
                onClick={() => hasPrev && setActiveLesson(orderedLessons[currentIndex - 1].id)}
              >
                <ChevronLeft className="h-4 w-4 me-1" />
                {isAr ? 'السابق' : 'Previous'}
              </Button>

              <div className="flex items-center gap-2">
                {canManage && currentLesson && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openEditDialog}
                    className="gap-1.5"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    {isAr ? 'إدارة المحتوى' : 'Manage Content'}
                  </Button>
                )}
                {user && currentLesson && !isCurrentCompleted && (
                  <Button
                    size="sm"
                    onClick={handleMarkComplete}
                    disabled={markingComplete}
                  >
                    {markingComplete ? (
                      <Loader2 className="h-4 w-4 me-1.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 me-1.5" />
                    )}
                    {isAr ? 'إكمال الدرس' : 'Mark Complete'}
                  </Button>
                )}
                {isCurrentCompleted && (
                  <Badge variant="default" className="gap-1 text-xs">
                    <CheckCircle2 className="h-3 w-3" />
                    {isAr ? 'مكتمل' : 'Completed'}
                  </Badge>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={!hasNext}
                onClick={() => hasNext && setActiveLesson(orderedLessons[currentIndex + 1].id)}
              >
                {isAr ? 'التالي' : 'Next'}
                <ChevronRight className="h-4 w-4 ms-1" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {isAr ? 'مغادرة صفحة التعلم؟' : 'Leave Learning Page?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? 'أي تقدم غير محفوظ قد يُفقد. تأكد من الضغط على "إكمال الدرس" قبل المغادرة للحفاظ على تقدمك.'
                : 'Any unsaved progress may be lost. Make sure to click "Mark Complete" before leaving to save your progress.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'متابعة التعلم' : 'Continue Learning'}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => navigate('/dashboard/courses')}
            >
              {isAr ? 'مغادرة' : 'Leave'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Content Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              {isAr ? 'إدارة محتوى الدرس' : 'Manage Lesson Content'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isAr ? 'رابط الفيديو' : 'Video URL'}</Label>
              <Input
                placeholder="https://..."
                value={editForm.video_url || ''}
                onChange={e => setEditForm(f => ({ ...f, video_url: e.target.value }))}
              />
            </div>
            <div>
              <Label>{isAr ? 'رابط الصوت' : 'Audio URL'}</Label>
              <Input
                placeholder="https://..."
                value={editForm.audio_url || ''}
                onChange={e => setEditForm(f => ({ ...f, audio_url: e.target.value }))}
              />
            </div>
            <div>
              <Label>{isAr ? 'رابط PDF' : 'PDF URL'}</Label>
              <Input
                placeholder="https://..."
                value={editForm.pdf_url || ''}
                onChange={e => setEditForm(f => ({ ...f, pdf_url: e.target.value }))}
              />
            </div>
            <div>
              <Label>{isAr ? 'رابط خارجي' : 'External Link'}</Label>
              <Input
                placeholder="https://..."
                value={editForm.external_url || ''}
                onChange={e => setEditForm(f => ({ ...f, external_url: e.target.value }))}
              />
            </div>
            <div>
              <Label>{isAr ? 'التعليمات' : 'Instructions'}</Label>
              <Textarea
                rows={3}
                value={editForm.instructions || ''}
                onChange={e => setEditForm(f => ({ ...f, instructions: e.target.value }))}
              />
            </div>
            <div>
              <Label>{isAr ? 'المحتوى النصي (HTML)' : 'Text Content (HTML)'}</Label>
              <Textarea
                rows={5}
                value={editForm.text || ''}
                onChange={e => setEditForm(f => ({ ...f, text: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSaveContent} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 me-1.5 animate-spin" />}
              {isAr ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseLearning;
