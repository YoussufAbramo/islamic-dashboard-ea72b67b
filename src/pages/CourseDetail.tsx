import { useState, useEffect, useMemo, useCallback } from 'react';
import { ACTION_BTN, ACTION_BTN_DESTRUCTIVE, ACTION_ICON } from '@/lib/actionBtnClass';
import { ActionButton } from '@/components/ui/action-button';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, ArrowLeft, Trash2, BookOpen, Clock, Signal, FolderTree, Layers, FileText, Pencil, Route, MoreHorizontal, Settings2, Edit, HelpCircle, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { arrayMove } from '@dnd-kit/sortable';
import SortableItem from '@/components/course/SortableItem';
import SortableList from '@/components/course/SortableList';

const contentTypeGroups = [
  {
    label: '📄 Text',
    items: [
      { value: 'table_of_content', label: 'Table of Content' },
      { value: 'read_listen', label: 'Read & Listen' },
      { value: 'memorization', label: 'Memorization' },
    ],
  },
  {
    label: '🎧 Audio',
    items: [
      { value: 'exercise_listen_choose', label: 'Listen & Choose' },
    ],
  },
  {
    label: '✏️ Exercises',
    items: [
      { value: 'exercise_text_match', label: 'Text Match' },
      { value: 'exercise_choose_correct', label: 'Choose Correct' },
      { value: 'exercise_choose_multiple', label: 'Choose Multiple' },
      { value: 'exercise_rearrange', label: 'Rearrange Words' },
      { value: 'exercise_missing_text', label: 'Missing Text' },
      { value: 'exercise_true_false', label: 'True / False' },
    ],
  },
  {
    label: '📚 Other',
    items: [
      { value: 'revision', label: 'Revision' },
      { value: 'homework', label: 'Homework' },
    ],
  },
];

const allContentTypes = contentTypeGroups.flatMap((g) => g.items);

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { role } = useAuth();
  const isAr = language === 'ar';
  const canEdit = role === 'admin' || role === 'teacher';

  const [course, setCourse] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [sections, setSections] = useState<Record<string, any[]>>({});
  const [contents, setContents] = useState<Record<string, any[]>>({});

  // Dialog states
  const [lessonDialog, setLessonDialog] = useState(false);
  const [sectionDialog, setSectionDialog] = useState(false);
  const [contentDialog, setContentDialog] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'lesson' | 'section' | 'content' } | null>(null);

  // Edit states
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);

  // Forms
  const [lessonForm, setLessonForm] = useState({ title: '', title_ar: '' });
  const [sectionForm, setSectionForm] = useState({ title: '', title_ar: '' });
  const [contentForm, setContentForm] = useState({ title: '', title_ar: '', lesson_type: 'read_listen' });

  const totalContent = useMemo(() => {
    return Object.values(contents).reduce((sum, arr) => sum + arr.length, 0);
  }, [contents]);

  const fetchCourse = async () => {
    const [courseRes, catRes, lvlRes, trkRes] = await Promise.all([
      supabase.from('courses').select('*').eq('id', id).single(),
      supabase.from('course_categories').select('*').order('sort_order'),
      supabase.from('course_levels').select('*').order('sort_order'),
      supabase.from('course_tracks').select('*').order('sort_order'),
    ]);
    setCourse(courseRes.data);
    setCategories(catRes.data || []);
    setLevels(lvlRes.data || []);
    setTracks(trkRes.data || []);
  };

  const fetchHierarchy = async () => {
    const { data: lessonData } = await supabase
      .from('course_sections')
      .select('*')
      .eq('course_id', id)
      .order('sort_order');
    setLessons(lessonData || []);

    if (!lessonData?.length) {
      setSections({});
      setContents({});
      return;
    }

    const lessonIds = lessonData.map((l: any) => l.id);
    const { data: sectionData } = await supabase
      .from('lesson_sections' as any)
      .select('*')
      .in('course_section_id', lessonIds)
      .order('sort_order');

    const sectionMap: Record<string, any[]> = {};
    for (const ls of lessonData) sectionMap[ls.id] = [];
    for (const s of (sectionData || [])) {
      const key = (s as any).course_section_id;
      if (!sectionMap[key]) sectionMap[key] = [];
      sectionMap[key].push(s);
    }
    setSections(sectionMap);

    const sectionIds = (sectionData || []).map((s: any) => s.id);
    if (!sectionIds.length) {
      setContents({});
      return;
    }
    const { data: contentData } = await supabase
      .from('lessons')
      .select('*')
      .in('section_id', sectionIds)
      .order('sort_order');

    const contentMap: Record<string, any[]> = {};
    for (const s of (sectionData || [])) contentMap[(s as any).id] = [];
    for (const c of (contentData || [])) {
      if (!contentMap[c.section_id]) contentMap[c.section_id] = [];
      contentMap[c.section_id].push(c);
    }
    setContents(contentMap);
  };

  useEffect(() => { fetchCourse(); fetchHierarchy(); }, [id]);

  // ─── Reorder helpers ───
  const reorderLessons = useCallback(async (activeId: string, overId: string) => {
    const oldIndex = lessons.findIndex(l => l.id === activeId);
    const newIndex = lessons.findIndex(l => l.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(lessons, oldIndex, newIndex);
    setLessons(reordered);
    const updates = reordered.map((item, i) =>
      supabase.from('course_sections').update({ sort_order: i }).eq('id', item.id)
    );
    await Promise.all(updates);
  }, [lessons]);

  const reorderSections = useCallback(async (lessonId: string, activeId: string, overId: string) => {
    const list = sections[lessonId] || [];
    const oldIndex = list.findIndex(s => s.id === activeId);
    const newIndex = list.findIndex(s => s.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(list, oldIndex, newIndex);
    setSections(prev => ({ ...prev, [lessonId]: reordered }));
    const updates = reordered.map((item, i) =>
      supabase.from('lesson_sections' as any).update({ sort_order: i } as any).eq('id', item.id)
    );
    await Promise.all(updates);
  }, [sections]);

  const reorderContents = useCallback(async (sectionId: string, activeId: string, overId: string) => {
    const list = contents[sectionId] || [];
    const oldIndex = list.findIndex(c => c.id === activeId);
    const newIndex = list.findIndex(c => c.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(list, oldIndex, newIndex);
    setContents(prev => ({ ...prev, [sectionId]: reordered }));
    const updates = reordered.map((item, i) =>
      supabase.from('lessons').update({ sort_order: i }).eq('id', item.id)
    );
    await Promise.all(updates);
  }, [contents]);

  // ─── CRUD: Lessons ───
  const addLesson = async () => {
    if (editingLessonId) {
      await supabase.from('course_sections').update({
        title: lessonForm.title,
        title_ar: lessonForm.title_ar,
      }).eq('id', editingLessonId);
      setEditingLessonId(null);
      toast.success(isAr ? 'تم تحديث الدرس' : 'Lesson updated');
    } else {
      await supabase.from('course_sections').insert({ ...lessonForm, course_id: id, sort_order: lessons.length });
      toast.success(isAr ? 'تمت إضافة الدرس' : 'Lesson added');
    }
    setLessonDialog(false);
    setLessonForm({ title: '', title_ar: '' });
    fetchHierarchy();
  };

  const openEditLesson = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setLessonForm({ title: lesson.title, title_ar: lesson.title_ar || '' });
    setLessonDialog(true);
  };

  // ─── CRUD: Sections ───
  const addSection = async () => {
    if (editingSectionId) {
      await supabase.from('lesson_sections' as any).update({
        title: sectionForm.title,
        title_ar: sectionForm.title_ar,
      } as any).eq('id', editingSectionId);
      setEditingSectionId(null);
      toast.success(isAr ? 'تم تحديث القسم' : 'Section updated');
    } else {
      if (!activeLessonId) return;
      const currentSections = sections[activeLessonId] || [];
      await supabase.from('lesson_sections' as any).insert([{
        course_section_id: activeLessonId,
        title: sectionForm.title,
        title_ar: sectionForm.title_ar,
        sort_order: currentSections.length,
      }] as any);
      toast.success(isAr ? 'تمت إضافة القسم' : 'Section added');
    }
    setSectionDialog(false);
    setSectionForm({ title: '', title_ar: '' });
    fetchHierarchy();
  };

  const openEditSection = (section: any, lessonId: string) => {
    setEditingSectionId(section.id);
    setActiveLessonId(lessonId);
    setSectionForm({ title: section.title, title_ar: section.title_ar || '' });
    setSectionDialog(true);
  };

  // ─── CRUD: Content ───
  const addContent = async () => {
    if (editingContentId) {
      await supabase.from('lessons').update({
        title: contentForm.title,
        title_ar: contentForm.title_ar,
        lesson_type: contentForm.lesson_type as any,
      }).eq('id', editingContentId);
      setEditingContentId(null);
      toast.success(isAr ? 'تم تحديث المحتوى' : 'Content updated');
    } else {
      if (!activeSectionId) return;
      const currentContents = contents[activeSectionId] || [];
      await supabase.from('lessons').insert([{
        title: contentForm.title,
        title_ar: contentForm.title_ar,
        lesson_type: contentForm.lesson_type as any,
        section_id: activeSectionId,
        sort_order: currentContents.length,
      }]);
      toast.success(isAr ? 'تمت إضافة المحتوى' : 'Content added');
    }
    setContentDialog(false);
    setContentForm({ title: '', title_ar: '', lesson_type: 'read_listen' });
    fetchHierarchy();
  };

  const openEditContent = (content: any, sectionId: string) => {
    setEditingContentId(content.id);
    setActiveSectionId(sectionId);
    setContentForm({ title: content.title, title_ar: content.title_ar || '', lesson_type: content.lesson_type });
    setContentDialog(true);
  };

  // ─── Delete ───
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { id, type } = deleteTarget;
    if (type === 'lesson') {
      await supabase.from('course_sections').delete().eq('id', id);
      toast.success(isAr ? 'تم حذف الدرس' : 'Lesson deleted');
    } else if (type === 'section') {
      await supabase.from('lesson_sections' as any).delete().eq('id', id);
      toast.success(isAr ? 'تم حذف القسم' : 'Section deleted');
    } else {
      await supabase.from('lessons').delete().eq('id', id);
      toast.success(isAr ? 'تم حذف المحتوى' : 'Content deleted');
    }
    setDeleteTarget(null);
    fetchHierarchy();
  };

  if (!course) return <div className="text-muted-foreground">{t('common.loading')}</div>;

  const categoryLabel = categories.find(c => c.id === course.category_id);
  const skillLabel = levels.find(l => l.id === course.level_id);
  const trackLabel = tracks.find(t => t.id === course.track_id);

  // ─── Item Actions Menu (reusable for lessons, sections, content) ───
  const ItemActionsMenu = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted shrink-0" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
          <Pencil className="h-3.5 w-3.5 me-2" />
          {isAr ? 'تعديل' : 'Edit'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <Trash2 className="h-3.5 w-3.5 me-2" />
          {isAr ? 'حذف' : 'Delete'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => navigate('/dashboard/courses')}>
        <ArrowLeft className="h-4 w-4 me-2" />{t('common.back')}
      </Button>

      {/* Course Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            {course.image_url && (
              <img src={course.image_url} alt={course.title} className="h-20 w-20 rounded-lg object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <CardTitle>{isAr && course.title_ar ? course.title_ar : course.title}</CardTitle>
              <p className="text-muted-foreground mt-1">{isAr && course.description_ar ? course.description_ar : course.description}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {categoryLabel && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <FolderTree className="h-3 w-3" />
                    {isAr && categoryLabel.title_ar ? categoryLabel.title_ar : categoryLabel.title}
                  </Badge>
                )}
                {skillLabel && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Signal className="h-3 w-3" />
                    {isAr && skillLabel.title_ar ? skillLabel.title_ar : skillLabel.title}
                  </Badge>
                )}
                {trackLabel && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Route className="h-3 w-3" />
                    {isAr && trackLabel.title_ar ? trackLabel.title_ar : trackLabel.title}
                  </Badge>
                )}
                {course.duration_weeks && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    {course.duration_weeks} {isAr ? 'أسابيع' : 'weeks'}
                  </Badge>
                )}
                <Badge variant="secondary" className="gap-1 text-xs">
                  <BookOpen className="h-3 w-3" />
                  {totalContent} {t('courses.content')}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Course Structure Documentation */}
      <Collapsible>
        <Card className="border-dashed">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 text-start hover:bg-muted/50 rounded-lg transition-colors group">
              <div className="flex items-center gap-2 text-muted-foreground">
                <HelpCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">
                  {isAr ? 'كيف يتم تنظيم الدورة؟' : 'How is the course structured?'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 text-sm text-muted-foreground">
              <p>
                {isAr
                  ? 'يتم تنظيم كل دورة في ثلاث طبقات متداخلة لتسهيل التعلم وتنظيم المحتوى:'
                  : 'Every course is organized into three nested layers to make learning easy and content well-structured:'}
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {/* Layer 1 */}
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {isAr ? '١. الدروس' : '1. Lessons'}
                  </div>
                  <p className="text-xs leading-relaxed">
                    {isAr
                      ? 'الدروس هي الوحدات الرئيسية للدورة. فكّر فيها كفصول في كتاب — كل درس يغطي موضوعاً مستقلاً.'
                      : 'Lessons are the main units of the course. Think of them as chapters in a book — each lesson covers a standalone topic.'}
                  </p>
                </div>

                {/* Layer 2 */}
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Layers className="h-4 w-4 text-primary" />
                    {isAr ? '٢. الأقسام' : '2. Sections'}
                  </div>
                  <p className="text-xs leading-relaxed">
                    {isAr
                      ? 'كل درس يحتوي على أقسام. الأقسام تقسّم الدرس إلى أجزاء أصغر ومركزة ليسهل استيعابها.'
                      : 'Each lesson contains sections. Sections break the lesson into smaller, focused parts that are easier to follow.'}
                  </p>
                </div>

                {/* Layer 3 */}
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <FileText className="h-4 w-4 text-primary" />
                    {isAr ? '٣. المحتوى' : '3. Content'}
                  </div>
                  <p className="text-xs leading-relaxed">
                    {isAr
                      ? 'داخل كل قسم، تضيف المحتوى الفعلي: نصوص للقراءة، تمارين تفاعلية، مراجعات، واجبات، وغيرها.'
                      : 'Inside each section, you add the actual content: reading text, interactive exercises, revisions, homework, and more.'}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                <p className="font-medium text-foreground text-xs">
                  {isAr ? '📌 مثال عملي:' : '📌 Quick example:'}
                </p>
                <div className="text-xs leading-relaxed space-y-1">
                  <p>{isAr ? '📖 الدرس: "الحروف العربية"' : '📖 Lesson: "Arabic Letters"'}</p>
                  <p className="ps-4">{isAr ? '📂 القسم: "حروف المد"' : '📂 Section: "Vowel Letters"'}</p>
                  <p className="ps-8">{isAr ? '📝 المحتوى: "اقرأ واستمع — حرف الألف" + تمرين اختيار الإجابة الصحيحة' : '📝 Content: "Read & Listen — Letter Alif" + Choose Correct exercise'}</p>
                </div>
              </div>

              <p className="text-xs italic">
                {isAr
                  ? '💡 يمكنك إعادة ترتيب الدروس والأقسام والمحتوى بالسحب والإفلات. استخدم قائمة "المزيد" (⋯) لتعديل أو حذف أي عنصر.'
                  : '💡 You can drag & drop to reorder lessons, sections, and content. Use the "More" menu (⋯) to edit or delete any item.'}
              </p>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Level 1: Lessons */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('courses.lessons')}</h2>
        {canEdit && (
          <Button size="sm" onClick={() => { setEditingLessonId(null); setLessonForm({ title: '', title_ar: '' }); setLessonDialog(true); }}>
            <Plus className="h-4 w-4 me-2" />{t('courses.addLesson')}
          </Button>
        )}
      </div>

      <SortableList items={lessons} onReorder={(a, o) => reorderLessons(a, o)}>
        <Accordion type="multiple" className="space-y-2">
          {lessons.map((lesson) => (
            <SortableItem key={lesson.id} id={lesson.id} disabled={!canEdit}>
              <AccordionItem value={lesson.id} className="border rounded-lg px-4">
                <div className="flex items-center gap-1">
                  {canEdit && (
                    <ItemActionsMenu
                      onEdit={() => openEditLesson(lesson)}
                      onDelete={() => setDeleteTarget({ id: lesson.id, type: 'lesson' })}
                    />
                  )}
                  <AccordionTrigger className="hover:no-underline flex-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>{isAr && lesson.title_ar ? lesson.title_ar : lesson.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {(sections[lesson.id] || []).length} {t('courses.sections')}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                </div>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" />
                        {t('courses.sections')}
                      </h3>
                      {canEdit && (
                        <Button variant="outline" size="sm" onClick={() => { setActiveLessonId(lesson.id); setEditingSectionId(null); setSectionForm({ title: '', title_ar: '' }); setSectionDialog(true); }}>
                          <Plus className="h-3 w-3 me-1" />{t('courses.addSection')}
                        </Button>
                      )}
                    </div>

                    {(sections[lesson.id] || []).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">{t('common.noData')}</p>
                    )}

                    <SortableList items={sections[lesson.id] || []} onReorder={(a, o) => reorderSections(lesson.id, a, o)}>
                      <Accordion type="multiple" className="space-y-1">
                        {(sections[lesson.id] || []).map((section: any) => (
                          <SortableItem key={section.id} id={section.id} disabled={!canEdit}>
                            <AccordionItem value={section.id} className="border rounded-md px-3 bg-muted/30">
                              <div className="flex items-center gap-1">
                                {canEdit && (
                                  <ItemActionsMenu
                                    onEdit={() => openEditSection(section, lesson.id)}
                                    onDelete={() => setDeleteTarget({ id: section.id, type: 'section' })}
                                  />
                                )}
                                <AccordionTrigger className="hover:no-underline py-3 text-sm flex-1">
                                  <div className="flex items-center gap-2">
                                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>{isAr && section.title_ar ? section.title_ar : section.title}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {(contents[section.id] || []).length} {t('courses.content')}
                                    </Badge>
                                  </div>
                                </AccordionTrigger>
                              </div>
                              <AccordionContent>
                                <div className="space-y-2 pt-1">
                                  <SortableList items={contents[section.id] || []} onReorder={(a, o) => reorderContents(section.id, a, o)}>
                                    <div className="space-y-1">
                                      {(contents[section.id] || []).map((content: any) => (
                                        <SortableItem key={content.id} id={content.id} disabled={!canEdit}>
                                          <div className="flex items-center justify-between p-2 rounded bg-background border group">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                              <span className="font-medium text-sm truncate">{isAr && content.title_ar ? content.title_ar : content.title}</span>
                                              <Badge variant="outline" className="text-xs shrink-0">
                                                {allContentTypes.find(ct => ct.value === content.lesson_type)?.label || content.lesson_type}
                                              </Badge>
                                            </div>
                                            {canEdit && (
                                              <div className="flex items-center gap-0.5 shrink-0">
                                                <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={(e) => { e.stopPropagation(); openEditContent(content, section.id); }}>
                                                  <Settings2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={(e) => { e.stopPropagation(); /* edit content handler - to be implemented */ }}>
                                                  <Edit className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: content.id, type: 'content' }); }}>
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        </SortableItem>
                                      ))}
                                    </div>
                                  </SortableList>

                                  {canEdit && (
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => { setActiveSectionId(section.id); setEditingContentId(null); setContentForm({ title: '', title_ar: '', lesson_type: 'read_listen' }); setContentDialog(true); }}>
                                      <Plus className="h-3 w-3 me-1" />{t('courses.addContent')}
                                    </Button>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </SortableItem>
                        ))}
                      </Accordion>
                    </SortableList>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </SortableItem>
          ))}
        </Accordion>
      </SortableList>

      {lessons.length === 0 && <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>}

      {/* ─── Lesson Dialog (Add/Edit) ─── */}
      <Dialog open={lessonDialog} onOpenChange={(o) => { setLessonDialog(o); if (!o) { setEditingLessonId(null); setLessonForm({ title: '', title_ar: '' }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingLessonId ? <Pencil className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
              {editingLessonId ? (isAr ? 'تعديل الدرس' : 'Edit Lesson') : t('courses.addLesson')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Title (EN)</Label><Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} /></div>
              <div><Label>Title (AR)</Label><Input value={lessonForm.title_ar} onChange={(e) => setLessonForm({ ...lessonForm, title_ar: e.target.value })} dir="rtl" className="text-right" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialog(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={addLesson} disabled={!lessonForm.title.trim()}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Section Dialog (Add/Edit) ─── */}
      <Dialog open={sectionDialog} onOpenChange={(o) => { setSectionDialog(o); if (!o) { setEditingSectionId(null); setSectionForm({ title: '', title_ar: '' }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingSectionId ? <Pencil className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
              {editingSectionId ? (isAr ? 'تعديل القسم' : 'Edit Section') : t('courses.addSection')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Title (EN)</Label><Input value={sectionForm.title} onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })} /></div>
              <div><Label>Title (AR)</Label><Input value={sectionForm.title_ar} onChange={(e) => setSectionForm({ ...sectionForm, title_ar: e.target.value })} dir="rtl" className="text-right" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionDialog(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={addSection} disabled={!sectionForm.title.trim()}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Content Dialog (Add/Edit) ─── */}
      <Dialog open={contentDialog} onOpenChange={(o) => { setContentDialog(o); if (!o) { setEditingContentId(null); setContentForm({ title: '', title_ar: '', lesson_type: 'read_listen' }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingContentId ? <Settings2 className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
              {editingContentId ? (isAr ? 'تعديل المحتوى' : 'Edit Content') : t('courses.addContent')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Title (EN)</Label><Input value={contentForm.title} onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })} /></div>
              <div><Label>Title (AR)</Label><Input value={contentForm.title_ar} onChange={(e) => setContentForm({ ...contentForm, title_ar: e.target.value })} dir="rtl" className="text-right" /></div>
            </div>
            <div>
              <Label>{t('courses.contentType')}</Label>
              <Select value={contentForm.lesson_type} onValueChange={(v) => setContentForm({ ...contentForm, lesson_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {contentTypeGroups.map((group) => (
                    <SelectGroup key={group.label}>
                      <SelectLabel className="text-xs font-semibold text-muted-foreground">{group.label}</SelectLabel>
                      {group.items.map((ct) => (
                        <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContentDialog(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={addContent} disabled={!contentForm.title.trim()}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr ? 'هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleConfirmDelete}>
              {isAr ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseDetail;
