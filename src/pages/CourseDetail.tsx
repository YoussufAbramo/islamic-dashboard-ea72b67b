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
import { Plus, ArrowLeft, Trash2, BookOpen, Clock, Signal, FolderTree, Layers, FileText, Pencil, Route, MoreHorizontal, Settings2, Edit, HelpCircle, ChevronDown, Link2, GraduationCap, SlidersHorizontal, Check, X } from 'lucide-react';
import PresetSections from '@/components/course/PresetSections';
import LessonBuilder from '@/components/course/LessonBuilder';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { arrayMove } from '@dnd-kit/sortable';
import SortableItem from '@/components/course/SortableItem';
import SortableList from '@/components/course/SortableList';


const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { role } = useAuth();
  const isAr = language === 'ar';
  const canEdit = role === 'admin' || role === 'teacher';

  const [course, setCourse] = useState<any>(null);
  const [courseSettingsOpen, setCourseSettingsOpen] = useState(false);
  const [slugForm, setSlugForm] = useState('');
  const [settingsForm, setSettingsForm] = useState({
    title: '', title_ar: '', description: '', description_ar: '',
    category_id: '', level_id: '', track_id: '', duration_weeks: '' as string,
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [sections, setSections] = useState<Record<string, any[]>>({});
  const [lessonItems, setLessonItems] = useState<Record<string, any[]>>({});

  // Dialog states
  const [topicDialog, setTopicDialog] = useState(false);
  const [docsDialogOpen, setDocsDialogOpen] = useState(false);
  const [sectionDialog, setSectionDialog] = useState(false);
  const [lessonDialog, setLessonDialog] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'topic' | 'section' | 'lesson' } | null>(null);

  // Edit states
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // Forms
  const [topicForm, setTopicForm] = useState({ title: '', title_ar: '' });
  const [sectionForm, setSectionForm] = useState({ title: '', title_ar: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', title_ar: '' });

  // Inline edit state
  const [inlineEdit, setInlineEdit] = useState<{ id: string; type: 'topic' | 'section' | 'lesson'; field: string; value: string } | null>(null);
  const [builderLesson, setBuilderLesson] = useState<any | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);

  const handleInlineDoubleClick = (id: string, type: 'topic' | 'section' | 'lesson', currentValue: string) => {
    if (!canEdit) return;
    setInlineEdit({ id, type, field: 'title', value: currentValue });
  };

  const handleInlineSave = async () => {
    if (!inlineEdit || !inlineEdit.value.trim()) return;
    const { id: itemId, type, value } = inlineEdit;
    const field = isAr ? 'title_ar' : 'title';
    if (type === 'topic') {
      await supabase.from('course_sections').update({ [field]: value }).eq('id', itemId);
    } else if (type === 'section') {
      await supabase.from('lesson_sections' as any).update({ [field]: value } as any).eq('id', itemId);
    } else {
      await supabase.from('lessons').update({ [field]: value }).eq('id', itemId);
    }
    toast.success(isAr ? 'تم التحديث' : 'Updated');
    setInlineEdit(null);
    fetchHierarchy();
  };

  const handleInlineCancel = () => setInlineEdit(null);

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleInlineSave();
    if (e.key === 'Escape') handleInlineCancel();
  };

  const totalLessons = useMemo(() => {
    return Object.values(lessonItems).reduce((sum, arr) => sum + arr.length, 0);
  }, [lessonItems]);

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
    const { data: topicData } = await supabase
      .from('course_sections')
      .select('*')
      .eq('course_id', id)
      .order('sort_order');
    setTopics(topicData || []);

    if (!topicData?.length) {
      setSections({});
      setLessonItems({});
      return;
    }

    const topicIds = topicData.map((t: any) => t.id);
    const { data: sectionData } = await supabase
      .from('lesson_sections' as any)
      .select('*')
      .in('course_section_id', topicIds)
      .order('sort_order');

    const sectionMap: Record<string, any[]> = {};
    for (const tp of topicData) sectionMap[tp.id] = [];
    for (const s of (sectionData || [])) {
      const key = (s as any).course_section_id;
      if (!sectionMap[key]) sectionMap[key] = [];
      sectionMap[key].push(s);
    }
    setSections(sectionMap);

    const sectionIds = (sectionData || []).map((s: any) => s.id);
    if (!sectionIds.length) {
      setLessonItems({});
      return;
    }
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('*')
      .in('section_id', sectionIds)
      .order('sort_order');

    const lessonMap: Record<string, any[]> = {};
    for (const s of (sectionData || [])) lessonMap[(s as any).id] = [];
    for (const l of (lessonData || [])) {
      if (!lessonMap[l.section_id]) lessonMap[l.section_id] = [];
      lessonMap[l.section_id].push(l);
    }
    setLessonItems(lessonMap);
  };

  useEffect(() => { fetchCourse(); fetchHierarchy(); }, [id]);

  // ─── Reorder helpers ───
  const reorderTopics = useCallback(async (activeId: string, overId: string) => {
    const oldIndex = topics.findIndex(t => t.id === activeId);
    const newIndex = topics.findIndex(t => t.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(topics, oldIndex, newIndex);
    setTopics(reordered);
    const updates = reordered.map((item, i) =>
      supabase.from('course_sections').update({ sort_order: i }).eq('id', item.id)
    );
    await Promise.all(updates);
  }, [topics]);

  const reorderSections = useCallback(async (topicId: string, activeId: string, overId: string) => {
    const list = sections[topicId] || [];
    const oldIndex = list.findIndex(s => s.id === activeId);
    const newIndex = list.findIndex(s => s.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(list, oldIndex, newIndex);
    setSections(prev => ({ ...prev, [topicId]: reordered }));
    const updates = reordered.map((item, i) =>
      supabase.from('lesson_sections' as any).update({ sort_order: i } as any).eq('id', item.id)
    );
    await Promise.all(updates);
  }, [sections]);

  const reorderLessons = useCallback(async (sectionId: string, activeId: string, overId: string) => {
    const list = lessonItems[sectionId] || [];
    const oldIndex = list.findIndex(c => c.id === activeId);
    const newIndex = list.findIndex(c => c.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(list, oldIndex, newIndex);
    setLessonItems(prev => ({ ...prev, [sectionId]: reordered }));
    const updates = reordered.map((item, i) =>
      supabase.from('lessons').update({ sort_order: i }).eq('id', item.id)
    );
    await Promise.all(updates);
  }, [lessonItems]);

  // ─── CRUD: Topics (course_sections) ───
  const addTopic = async () => {
    if (editingTopicId) {
      await supabase.from('course_sections').update({
        title: topicForm.title,
        title_ar: topicForm.title_ar,
      }).eq('id', editingTopicId);
      setEditingTopicId(null);
      toast.success(isAr ? 'تم تحديث الموضوع' : 'Topic updated');
    } else {
      await supabase.from('course_sections').insert({ ...topicForm, course_id: id, sort_order: topics.length });
      toast.success(isAr ? 'تمت إضافة الموضوع' : 'Topic added');
    }
    setTopicDialog(false);
    setTopicForm({ title: '', title_ar: '' });
    fetchHierarchy();
  };

  const openEditTopic = (topic: any) => {
    setEditingTopicId(topic.id);
    setTopicForm({ title: topic.title, title_ar: topic.title_ar || '' });
    setTopicDialog(true);
  };

  // ─── CRUD: Sections (lesson_sections) ───
  const addSection = async () => {
    if (editingSectionId) {
      await supabase.from('lesson_sections' as any).update({
        title: sectionForm.title,
        title_ar: sectionForm.title_ar,
      } as any).eq('id', editingSectionId);
      setEditingSectionId(null);
      toast.success(isAr ? 'تم تحديث القسم' : 'Section updated');
    } else {
      if (!activeTopicId) return;
      const currentSections = sections[activeTopicId] || [];
      await supabase.from('lesson_sections' as any).insert([{
        course_section_id: activeTopicId,
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

  const openEditSection = (section: any, topicId: string) => {
    setEditingSectionId(section.id);
    setActiveTopicId(topicId);
    setSectionForm({ title: section.title, title_ar: section.title_ar || '' });
    setSectionDialog(true);
  };

  // ─── CRUD: Lessons (lessons table) ───
  const addLesson = async () => {
    if (editingLessonId) {
      await supabase.from('lessons').update({
        title: lessonForm.title,
        title_ar: lessonForm.title_ar,
      }).eq('id', editingLessonId);
      setEditingLessonId(null);
      toast.success(isAr ? 'تم تحديث الدرس' : 'Lesson updated');
    } else {
      if (!activeSectionId) return;
      const currentLessons = lessonItems[activeSectionId] || [];
      await supabase.from('lessons').insert([{
        title: lessonForm.title,
        title_ar: lessonForm.title_ar,
        section_id: activeSectionId,
        sort_order: currentLessons.length,
      }]);
      toast.success(isAr ? 'تمت إضافة الدرس' : 'Lesson added');
    }
    setLessonDialog(false);
    setLessonForm({ title: '', title_ar: '' });
    fetchHierarchy();
  };

  const openEditLesson = (lesson: any, sectionId: string) => {
    setEditingLessonId(lesson.id);
    setActiveSectionId(sectionId);
    setLessonForm({ title: lesson.title, title_ar: lesson.title_ar || '' });
    setLessonDialog(true);
  };

  // ─── Delete ───
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { id, type } = deleteTarget;
    if (type === 'topic') {
      await supabase.from('course_sections').delete().eq('id', id);
      toast.success(isAr ? 'تم حذف الموضوع' : 'Topic deleted');
    } else if (type === 'section') {
      await supabase.from('lesson_sections' as any).delete().eq('id', id);
      toast.success(isAr ? 'تم حذف القسم' : 'Section deleted');
    } else {
      await supabase.from('lessons').delete().eq('id', id);
      toast.success(isAr ? 'تم حذف الدرس' : 'Lesson deleted');
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
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CardTitle>{isAr && course.title_ar ? course.title_ar : course.title}</CardTitle>
                  {canEdit && (
                    <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground shrink-0" onClick={() => {
                      setSlugForm(course.slug || '');
                      setSettingsForm({
                        title: course.title || '', title_ar: course.title_ar || '',
                        description: course.description || '', description_ar: course.description_ar || '',
                        category_id: course.category_id || '', level_id: course.level_id || '',
                        track_id: course.track_id || '', duration_weeks: course.duration_weeks?.toString() || '',
                      });
                      setCourseSettingsOpen(true);
                    }}>
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => navigate(`/dashboard/courses/${id}/learn`)}
                >
                  <GraduationCap className="h-4 w-4" />
                  {isAr ? 'ابدأ التعلم' : 'Learn Now'}
                </Button>
              </div>
              <p className="text-muted-foreground mt-1">{isAr && course.description_ar ? course.description_ar : course.description}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {course.slug && (
                  <Badge variant="outline" className="gap-1 text-xs font-mono">
                    <Link2 className="h-3 w-3" />
                    /{course.slug}
                  </Badge>
                )}
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
                  {totalLessons} {t('courses.lessons')}
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
          <CollapsibleContent className="animate-accordion-down data-[state=closed]:animate-accordion-up">
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
                    {isAr ? '١. المواضيع' : '1. Topics'}
                  </div>
                  <p className="text-xs leading-relaxed">
                    {isAr
                      ? 'المواضيع هي الوحدات الرئيسية للدورة. فكّر فيها كفصول في كتاب — كل موضوع يغطي مجالاً مستقلاً.'
                      : 'Topics are the main units of the course. Think of them as chapters in a book — each topic covers a standalone subject area.'}
                  </p>
                </div>

                {/* Layer 2 */}
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Layers className="h-4 w-4" style={{ color: 'hsl(var(--gold))' }} />
                    {isAr ? '٢. الأقسام' : '2. Sections'}
                  </div>
                  <p className="text-xs leading-relaxed">
                    {isAr
                      ? 'كل موضوع يحتوي على أقسام. الأقسام تقسّم الموضوع إلى أجزاء أصغر ومركزة ليسهل استيعابها.'
                      : 'Each topic contains sections. Sections break the topic into smaller, focused parts that are easier to follow.'}
                  </p>
                </div>

                {/* Layer 3 */}
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {isAr ? '٣. الدروس' : '3. Lessons'}
                  </div>
                  <p className="text-xs leading-relaxed">
                    {isAr
                      ? 'داخل كل قسم، تضيف الدروس الفعلية: نصوص للقراءة، تمارين تفاعلية، مراجعات، واجبات، وغيرها.'
                      : 'Inside each section, you add the actual lessons: reading text, interactive exercises, revisions, homework, and more.'}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                <p className="font-medium text-foreground text-xs">
                  {isAr ? '📌 مثال عملي:' : '📌 Quick example:'}
                </p>
                <div className="text-xs leading-relaxed space-y-1">
                  <p>{isAr ? '📖 الموضوع: "الحروف العربية"' : '📖 Topic: "Arabic Letters"'}</p>
                  <p className="ps-4">{isAr ? '📂 القسم: "حروف المد"' : '📂 Section: "Vowel Letters"'}</p>
                  <p className="ps-8">{isAr ? '📝 الدرس: "اقرأ واستمع — حرف الألف" + تمرين اختيار الإجابة الصحيحة' : '📝 Lesson: "Read & Listen — Letter Alif" + Choose Correct exercise'}</p>
                </div>
              </div>

              <p className="text-xs italic">
                {isAr
                  ? '💡 يمكنك إعادة ترتيب المواضيع والأقسام والدروس بالسحب والإفلات. انقر مرتين على أي عنوان لتعديله مباشرة. استخدم قائمة "المزيد" (⋯) لتعديل أو حذف أي عنصر.'
                  : '💡 You can drag & drop to reorder topics, sections, and lessons. Double-click any title to rename it inline. Use the "More" menu (⋯) to edit or delete any item.'}
              </p>

              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setDocsDialogOpen(true)}>
                <BookOpen className="h-3.5 w-3.5" />
                {isAr ? 'التوثيق الكامل' : 'Full Documentation'}
              </Button>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Course Structure Legend */}
      <div className="flex items-center gap-4 px-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
          <span>{isAr ? 'موضوع' : 'Topic'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(var(--gold))' }} />
          <span>{isAr ? 'قسم' : 'Section'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/40" />
          <span>{isAr ? 'درس' : 'Lesson'}</span>
        </div>
      </div>

      {/* Level 1: Topics */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('courses.topics')}</h2>
        {canEdit && (
          <div className="flex items-center gap-2">
            <PresetSections courseId={id!} currentTopicCount={topics.length} topics={topics} onInserted={fetchHierarchy} />
            <Button size="sm" onClick={() => { setEditingTopicId(null); setTopicForm({ title: '', title_ar: '' }); setTopicDialog(true); }}>
              <Plus className="h-4 w-4 me-2" />{t('courses.addTopic')}
            </Button>
          </div>
        )}
      </div>

      <SortableList items={topics} onReorder={(a, o) => reorderTopics(a, o)}>
        <div className="space-y-3">
          {topics.map((topic, topicIdx) => (
            <SortableItem key={topic.id} id={topic.id} disabled={!canEdit}>
              <div className="rounded-lg border-2 border-primary/20 bg-card overflow-hidden">
                {/* Topic Header */}
                <Collapsible defaultOpen>
                  <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary text-primary-foreground text-xs font-bold shrink-0">
                      {topicIdx + 1}
                    </div>
                    <CollapsibleTrigger className="flex items-center gap-2 flex-1 min-w-0 text-start group">
                      <BookOpen className="h-4 w-4 text-primary shrink-0" />
                      {inlineEdit?.id === topic.id && inlineEdit?.type === 'topic' ? (
                        <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={inlineEdit.value}
                            onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                            onKeyDown={handleInlineKeyDown}
                            autoFocus
                            className="h-7 text-sm font-semibold"
                            onClick={(e) => e.preventDefault()}
                          />
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-primary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleInlineSave(); }}><Check className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleInlineCancel(); }}><X className="h-3.5 w-3.5" /></Button>
                        </div>
                      ) : (
                        <span
                          className="font-semibold truncate cursor-text"
                          onDoubleClick={(e) => { e.stopPropagation(); handleInlineDoubleClick(topic.id, 'topic', isAr && topic.title_ar ? topic.title_ar : topic.title); }}
                        >
                          {isAr && topic.title_ar ? topic.title_ar : topic.title}
                        </span>
                      )}
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {(sections[topic.id] || []).length} {isAr ? 'قسم' : 'sec'}
                      </Badge>
                      <ChevronDown className="h-4 w-4 text-muted-foreground ms-auto transition-transform group-data-[state=open]:rotate-180 shrink-0" />
                    </CollapsibleTrigger>
                    {canEdit && (
                      <ItemActionsMenu
                        onEdit={() => openEditTopic(topic)}
                        onDelete={() => setDeleteTarget({ id: topic.id, type: 'topic' })}
                      />
                    )}
                  </div>
                  <CollapsibleContent className="animate-accordion-down data-[state=closed]:animate-accordion-up">
                    <div className="p-4 space-y-3">
                      {/* Sections within this Topic */}
                      <SortableList items={sections[topic.id] || []} onReorder={(a, o) => reorderSections(topic.id, a, o)}>
                        <div className="space-y-2">
                          {(sections[topic.id] || []).map((section: any, secIdx: number) => (
                            <SortableItem key={section.id} id={section.id} disabled={!canEdit}>
                              <div className="rounded-md border overflow-hidden" style={{ borderInlineStartWidth: '3px', borderInlineStartColor: 'hsl(var(--gold))' }}>
                                {/* Section Header */}
                                <Collapsible defaultOpen>
                                  <div className="flex items-center gap-2 px-3 py-2.5 bg-secondary/40">
                                    <span className="text-[10px] font-bold text-muted-foreground tabular-nums shrink-0">{topicIdx + 1}.{secIdx + 1}</span>
                                    <CollapsibleTrigger className="flex items-center gap-2 flex-1 min-w-0 text-start group">
                                      <Layers className="h-3.5 w-3.5 shrink-0" style={{ color: 'hsl(var(--gold))' }} />
                                      {inlineEdit?.id === section.id && inlineEdit?.type === 'section' ? (
                                        <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                                          <Input
                                            value={inlineEdit.value}
                                            onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                                            onKeyDown={handleInlineKeyDown}
                                            autoFocus
                                            className="h-6 text-xs font-medium"
                                            onClick={(e) => e.preventDefault()}
                                          />
                                          <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-primary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleInlineSave(); }}><Check className="h-3 w-3" /></Button>
                                          <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-muted-foreground" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleInlineCancel(); }}><X className="h-3 w-3" /></Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-sm font-medium truncate cursor-text"
                                          onDoubleClick={(e) => { e.stopPropagation(); handleInlineDoubleClick(section.id, 'section', isAr && section.title_ar ? section.title_ar : section.title); }}
                                        >
                                          {isAr && section.title_ar ? section.title_ar : section.title}
                                        </span>
                                      )}
                                      <Badge variant="outline" className="text-[10px] shrink-0">
                                        {(lessonItems[section.id] || []).length} {isAr ? 'درس' : 'les'}
                                      </Badge>
                                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ms-auto transition-transform group-data-[state=open]:rotate-180 shrink-0" />
                                    </CollapsibleTrigger>
                                    {canEdit && (
                                      <ItemActionsMenu
                                        onEdit={() => openEditSection(section, topic.id)}
                                        onDelete={() => setDeleteTarget({ id: section.id, type: 'section' })}
                                      />
                                    )}
                                  </div>
                                  <CollapsibleContent className="animate-accordion-down data-[state=closed]:animate-accordion-up">
                                    <div className="px-3 pb-3 pt-2 space-y-1.5">
                                      {/* Lessons within this Section */}
                                      <SortableList items={lessonItems[section.id] || []} onReorder={(a, o) => reorderLessons(section.id, a, o)}>
                                        <div className="space-y-1">
                                          {(lessonItems[section.id] || []).map((lesson: any, lesIdx: number) => (
                                            <SortableItem key={lesson.id} id={lesson.id} disabled={!canEdit}>
                                              <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/40 border border-transparent hover:border-border group/lesson transition-colors">
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                  <span className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">{topicIdx + 1}.{secIdx + 1}.{lesIdx + 1}</span>
                                                  <FileText className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                                                  <span
                                                    className="text-sm truncate cursor-text"
                                                    onDoubleClick={(e) => { e.stopPropagation(); handleInlineDoubleClick(lesson.id, 'lesson', isAr && lesson.title_ar ? lesson.title_ar : lesson.title); }}
                                                  >
                                                    {inlineEdit?.id === lesson.id && inlineEdit?.type === 'lesson' ? null : (isAr && lesson.title_ar ? lesson.title_ar : lesson.title)}
                                                  </span>
                                                  {inlineEdit?.id === lesson.id && inlineEdit?.type === 'lesson' && (
                                                    <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                                                      <Input
                                                        value={inlineEdit.value}
                                                        onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                                                        onKeyDown={handleInlineKeyDown}
                                                        autoFocus
                                                        className="h-6 text-xs"
                                                      />
                                                      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-primary" onClick={(e) => { e.stopPropagation(); handleInlineSave(); }}><Check className="h-3 w-3" /></Button>
                                                      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-muted-foreground" onClick={(e) => { e.stopPropagation(); handleInlineCancel(); }}><X className="h-3 w-3" /></Button>
                                                    </div>
                                                  )}
                                                  {canEdit ? (
                                                    <Select
                                                      value={lesson.lesson_type}
                                                      onValueChange={async (v) => {
                                                        await supabase.from('lessons').update({ lesson_type: v as any }).eq('id', lesson.id);
                                                        fetchHierarchy();
                                                      }}
                                                    >
                                                      <SelectTrigger className="h-6 w-auto min-w-0 max-w-[140px] text-[10px] font-normal px-2 py-0 gap-1 border-border/60 bg-background shrink-0 [&>svg]:h-3 [&>svg]:w-3">
                                                        <SelectValue />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        {contentTypeGroups.map(group => (
                                                          <SelectGroup key={group.label}>
                                                            <SelectLabel className="text-[10px]">{group.label}</SelectLabel>
                                                            {group.items.map(ct => (
                                                              <SelectItem key={ct.value} value={ct.value} className="text-xs">{ct.label}</SelectItem>
                                                            ))}
                                                          </SelectGroup>
                                                        ))}
                                                      </SelectContent>
                                                    </Select>
                                                  ) : (
                                                    <Badge variant="outline" className="text-[10px] font-normal shrink-0 bg-background">
                                                      {allContentTypes.find(ct => ct.value === lesson.lesson_type)?.label || lesson.lesson_type}
                                                    </Badge>
                                                  )}
                                                </div>
                                                {canEdit && (
                                                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/lesson:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={(e) => { e.stopPropagation(); setBuilderLesson(lesson); setBuilderOpen(true); }}>
                                                       <Edit className="h-3.5 w-3.5" />
                                                     </Button>
                                                    <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: lesson.id, type: 'lesson' }); }}>
                                                      <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                  </div>
                                                )}
                                              </div>
                                            </SortableItem>
                                          ))}
                                        </div>
                                      </SortableList>

                                      {(lessonItems[section.id] || []).length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-3">{isAr ? 'لا توجد دروس بعد' : 'No lessons yet'}</p>
                                      )}

                                      {canEdit && (
                                        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/60 hover:border-border mt-1" onClick={() => { setActiveSectionId(section.id); setEditingLessonId(null); setLessonForm({ title: '', title_ar: '', lesson_type: 'read_listen' }); setLessonDialog(true); }}>
                                          <Plus className="h-3 w-3 me-1" />{t('courses.addLesson')}
                                        </Button>
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              </div>
                            </SortableItem>
                          ))}
                        </div>
                      </SortableList>

                      {(sections[topic.id] || []).length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-3">{isAr ? 'لا توجد أقسام بعد' : 'No sections yet'}</p>
                      )}

                      {canEdit && (
                        <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => { setActiveTopicId(topic.id); setEditingSectionId(null); setSectionForm({ title: '', title_ar: '' }); setSectionDialog(true); }}>
                          <Plus className="h-3 w-3 me-1" />{t('courses.addSection')}
                        </Button>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </SortableItem>
          ))}
        </div>
      </SortableList>

      {topics.length === 0 && <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>}

      {/* ─── Topic Dialog (Add/Edit) ─── */}
      <Dialog open={topicDialog} onOpenChange={(o) => { setTopicDialog(o); if (!o) { setEditingTopicId(null); setTopicForm({ title: '', title_ar: '' }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingTopicId ? <Pencil className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
              {editingTopicId ? (isAr ? 'تعديل الموضوع' : 'Edit Topic') : t('courses.addTopic')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Title (EN)</Label><Input value={topicForm.title} onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })} /></div>
              <div><Label>Title (AR)</Label><Input value={topicForm.title_ar} onChange={(e) => setTopicForm({ ...topicForm, title_ar: e.target.value })} dir="rtl" className="text-right" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopicDialog(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={addTopic} disabled={!topicForm.title.trim()}>{t('common.save')}</Button>
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

      {/* ─── Lesson Dialog (Add/Edit) ─── */}
      <Dialog open={lessonDialog} onOpenChange={(o) => { setLessonDialog(o); if (!o) { setEditingLessonId(null); setLessonForm({ title: '', title_ar: '', lesson_type: 'read_listen' }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingLessonId ? <Settings2 className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
              {editingLessonId ? (isAr ? 'تعديل الدرس' : 'Edit Lesson') : t('courses.addLesson')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Title (EN)</Label><Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} /></div>
              <div><Label>Title (AR)</Label><Input value={lessonForm.title_ar} onChange={(e) => setLessonForm({ ...lessonForm, title_ar: e.target.value })} dir="rtl" className="text-right" /></div>
            </div>
            <div>
              <Label>{t('courses.lessonType')}</Label>
              <Select value={lessonForm.lesson_type} onValueChange={(v) => setLessonForm({ ...lessonForm, lesson_type: v })}>
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
            <Button variant="outline" onClick={() => setLessonDialog(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={addLesson} disabled={!lessonForm.title.trim()}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Settings Dialog */}
      <Dialog open={courseSettingsOpen} onOpenChange={setCourseSettingsOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              {isAr ? 'إعدادات الدورة' : 'Course Settings'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{isAr ? 'العنوان (إنجليزي)' : 'Title (English)'}</Label>
                <Input value={settingsForm.title} onChange={(e) => setSettingsForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>{isAr ? 'العنوان (عربي)' : 'Title (Arabic)'}</Label>
                <Input value={settingsForm.title_ar} onChange={(e) => setSettingsForm(f => ({ ...f, title_ar: e.target.value }))} className="mt-1" dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{isAr ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
                <Input value={settingsForm.description} onChange={(e) => setSettingsForm(f => ({ ...f, description: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>{isAr ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
                <Input value={settingsForm.description_ar} onChange={(e) => setSettingsForm(f => ({ ...f, description_ar: e.target.value }))} className="mt-1" dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>{isAr ? 'التصنيف' : 'Category'}</Label>
                <Select value={settingsForm.category_id} onValueChange={(v) => setSettingsForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={isAr ? 'اختر' : 'Select'} /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{isAr && c.title_ar ? c.title_ar : c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? 'المستوى' : 'Level'}</Label>
                <Select value={settingsForm.level_id} onValueChange={(v) => setSettingsForm(f => ({ ...f, level_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={isAr ? 'اختر' : 'Select'} /></SelectTrigger>
                  <SelectContent>
                    {levels.map(l => <SelectItem key={l.id} value={l.id}>{isAr && l.title_ar ? l.title_ar : l.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? 'المسار' : 'Track'}</Label>
                <Select value={settingsForm.track_id} onValueChange={(v) => setSettingsForm(f => ({ ...f, track_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={isAr ? 'اختر' : 'Select'} /></SelectTrigger>
                  <SelectContent>
                    {tracks.map(tr => <SelectItem key={tr.id} value={tr.id}>{isAr && tr.title_ar ? tr.title_ar : tr.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{isAr ? 'المدة (أسابيع)' : 'Duration (weeks)'}</Label>
                <Input type="number" min={1} value={settingsForm.duration_weeks} onChange={(e) => setSettingsForm(f => ({ ...f, duration_weeks: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  {isAr ? 'الرابط المختصر (Slug)' : 'URL Slug'}
                </Label>
                <Input
                  value={slugForm}
                  onChange={(e) => setSlugForm(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))}
                  placeholder="e.g. quran-memorization"
                  className="mt-1 font-mono text-sm"
                  dir="ltr"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {isAr ? 'أحرف إنجليزية صغيرة وأرقام وشرطات فقط.' : 'Lowercase letters, numbers, and hyphens only.'}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseSettingsOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={async () => {
              const updates: any = {
                title: settingsForm.title, title_ar: settingsForm.title_ar || null,
                description: settingsForm.description, description_ar: settingsForm.description_ar || null,
                category_id: settingsForm.category_id || null, level_id: settingsForm.level_id || null,
                track_id: settingsForm.track_id || null,
                duration_weeks: settingsForm.duration_weeks ? parseInt(settingsForm.duration_weeks) : null,
                slug: slugForm || null,
              };
              await supabase.from('courses').update(updates).eq('id', id);
              toast.success(isAr ? 'تم تحديث الإعدادات' : 'Settings updated');
              setCourseSettingsOpen(false);
              fetchCourse();
            }} disabled={!settingsForm.title.trim()}>{t('common.save')}</Button>
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

      {/* Lesson Builder */}
      <LessonBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        lesson={builderLesson}
        isAr={isAr}
        onSaved={fetchHierarchy}
      />

      {/* Full Documentation Dialog */}
      <Dialog open={docsDialogOpen} onOpenChange={setDocsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {isAr ? 'توثيق بناء الدورة' : 'Course Builder Documentation'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 text-sm">
            {/* Overview */}
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">
                {isAr ? '📋 نظرة عامة' : '📋 Overview'}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {isAr
                  ? 'يستخدم منشئ الدورات هيكلًا ثلاثي المستويات لتنظيم المحتوى التعليمي بشكل منهجي. هذا الهيكل يضمن تجربة تعلم واضحة ومتسلسلة للطلاب.'
                  : 'The Course Builder uses a three-level hierarchy to organize educational content systematically. This structure ensures a clear, sequential learning experience for students.'}
              </p>
            </div>

            {/* Hierarchy */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">
                {isAr ? '🏗️ الهيكل التنظيمي' : '🏗️ Content Hierarchy'}
              </h3>

              <div className="rounded-lg border overflow-hidden">
                <div className="bg-primary/10 px-4 py-3 flex items-center gap-2 border-b">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">{isAr ? 'المستوى ١: المواضيع (Topics)' : 'Level 1: Topics'}</span>
                </div>
                <div className="px-4 py-3 space-y-2 text-muted-foreground">
                  <p>{isAr ? 'المواضيع هي الوحدات الرئيسية (مثل فصول الكتاب). كل موضوع يمثل مجالاً تعليمياً مستقلاً.' : 'Topics are the top-level units — like chapters in a book. Each topic represents a standalone learning area.'}</p>
                  <p className="text-xs">{isAr ? '📖 مثال: "سورة الفاتحة"، "أحكام التجويد"، "الحروف العربية"' : '📖 Example: "Surah Al-Fatiha", "Tajweed Rules", "Arabic Letters"'}</p>
                </div>
              </div>

              <div className="rounded-lg border overflow-hidden" style={{ borderInlineStartWidth: '3px', borderInlineStartColor: 'hsl(var(--gold))' }}>
                <div className="bg-secondary/40 px-4 py-3 flex items-center gap-2 border-b">
                  <Layers className="h-4 w-4" style={{ color: 'hsl(var(--gold))' }} />
                  <span className="font-semibold text-foreground">{isAr ? 'المستوى ٢: الأقسام (Sections)' : 'Level 2: Sections'}</span>
                </div>
                <div className="px-4 py-3 space-y-2 text-muted-foreground">
                  <p>{isAr ? 'الأقسام تقسّم الموضوع إلى أجزاء أصغر. كل قسم يركز على جانب محدد من الموضوع.' : 'Sections break a topic into smaller parts. Each section focuses on a specific aspect of the topic.'}</p>
                  <p className="text-xs">{isAr ? '📂 مثال: "آيات ١-٥"، "أحكام النون الساكنة"، "حروف المد"' : '📂 Example: "Verses 1-5", "Rules of Noon Sakinah", "Vowel Letters"'}</p>
                </div>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <div className="bg-muted/40 px-4 py-3 flex items-center gap-2 border-b">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{isAr ? 'المستوى ٣: الدروس (Lessons)' : 'Level 3: Lessons'}</span>
                </div>
                <div className="px-4 py-3 space-y-2 text-muted-foreground">
                  <p>{isAr ? 'الدروس هي وحدات المحتوى الفعلية التي يتفاعل معها الطالب. كل درس له نوع يحدد طريقة العرض.' : 'Lessons are the actual content units students interact with. Each lesson has a type that determines its display format.'}</p>
                  <p className="text-xs">{isAr ? '📝 مثال: "اقرأ واستمع — الآية ١"، "تمرين اختيار الإجابة الصحيحة"' : '📝 Example: "Read & Listen — Verse 1", "Choose the Correct Answer exercise"'}</p>
                </div>
              </div>
            </div>

            {/* Lesson Types */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                {isAr ? '📚 أنواع الدروس' : '📚 Lesson Types'}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { type: 'table_of_content', en: 'Table of Content', ar: 'جدول المحتويات', desc: isAr ? 'عرض فهرس الدروس' : 'Displays a lesson index' },
                  { type: 'read_listen', en: 'Read & Listen', ar: 'قراءة واستماع', desc: isAr ? 'نص مع صوت للقراءة' : 'Text with audio for reading' },
                  { type: 'memorization', en: 'Memorization', ar: 'حفظ', desc: isAr ? 'تمارين الحفظ والتكرار' : 'Memorization and repetition exercises' },
                  { type: 'revision', en: 'Revision', ar: 'مراجعة', desc: isAr ? 'مراجعة المحتوى السابق' : 'Review of previous content' },
                  { type: 'homework', en: 'Homework', ar: 'واجب', desc: isAr ? 'مهام ليقوم بها الطالب' : 'Tasks for the student to complete' },
                  { type: 'exercise_text_match', en: 'Text Match', ar: 'مطابقة النص', desc: isAr ? 'مطابقة العناصر مع بعضها' : 'Match items together' },
                  { type: 'exercise_choose_correct', en: 'Choose Correct', ar: 'اختر الصحيح', desc: isAr ? 'اختيار إجابة واحدة صحيحة' : 'Select one correct answer' },
                  { type: 'exercise_choose_multiple', en: 'Choose Multiple', ar: 'اختر متعدد', desc: isAr ? 'اختيار عدة إجابات صحيحة' : 'Select multiple correct answers' },
                  { type: 'exercise_rearrange', en: 'Rearrange', ar: 'إعادة ترتيب', desc: isAr ? 'ترتيب الكلمات بالتسلسل الصحيح' : 'Arrange words in correct order' },
                  { type: 'exercise_missing_text', en: 'Missing Text', ar: 'نص ناقص', desc: isAr ? 'إكمال الفراغات في النص' : 'Fill in the blanks' },
                  { type: 'exercise_true_false', en: 'True / False', ar: 'صح / خطأ', desc: isAr ? 'تحديد صحة العبارات' : 'Determine statement validity' },
                  { type: 'exercise_listen_choose', en: 'Listen & Choose', ar: 'استمع واختر', desc: isAr ? 'استمع ثم اختر الإجابة' : 'Listen then choose the answer' },
                ].map(lt => (
                  <div key={lt.type} className="flex items-start gap-2 p-2 rounded-md border bg-muted/20">
                    <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{isAr ? lt.ar : lt.en}</Badge>
                    <span className="text-xs text-muted-foreground">{lt.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lesson Builder */}
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">
                {isAr ? '🛠️ محرر الدرس (Lesson Builder)' : '🛠️ Lesson Builder'}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {isAr
                  ? 'يمكنك فتح محرر الدرس بالنقر على أيقونة القلم (✏️) بجانب أي درس. يتيح لك المحرر إضافة كتل محتوى متعددة:'
                  : 'Open the Lesson Builder by clicking the pencil icon (✏️) next to any lesson. The builder lets you add multiple content blocks:'}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { icon: '📝', en: 'Text Block', ar: 'كتلة نص', desc: isAr ? 'محرر نصوص غني مع تنسيق (عناوين، قوائم، روابط)' : 'Rich text editor with formatting (headings, lists, links)' },
                  { icon: '🖼️', en: 'Image Block', ar: 'كتلة صورة', desc: isAr ? 'إضافة صور مع تسمية توضيحية ونص بديل' : 'Add images with caption and alt text' },
                  { icon: '🎬', en: 'Video Block', ar: 'كتلة فيديو', desc: isAr ? 'تضمين فيديو MP4 مع معاينة مباشرة' : 'Embed MP4 videos with live preview' },
                  { icon: '🎧', en: 'Audio Block', ar: 'كتلة صوت', desc: isAr ? 'إضافة ملفات صوتية (MP3, WAV, OGG)' : 'Add audio files (MP3, WAV, OGG)' },
                ].map(b => (
                  <div key={b.en} className="flex items-start gap-2 p-2.5 rounded-md border bg-muted/20">
                    <span className="text-base">{b.icon}</span>
                    <div>
                      <p className="text-xs font-medium text-foreground">{isAr ? b.ar : b.en}</p>
                      <p className="text-[11px] text-muted-foreground">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preset Sections */}
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">
                {isAr ? '⚡ القوالب الجاهزة (Presets)' : '⚡ Preset Sections'}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {isAr
                  ? 'استخدم زر "القوالب" لإدراج هياكل دروس جاهزة مصممة لتعليم القرآن. تشمل القوالب المتاحة: المقدمة، الآيات، التجويد، التدبر، التقييم، والواجبات. يمكن إدراج نفس القالب أكثر من مرة.'
                  : 'Use the "Presets" button to insert ready-made lesson structures designed for Quran education. Available presets include: Introduction, Ayat, Tajweed, Tadabbur, Assessment, and Assignment. The same preset can be inserted multiple times.'}
              </p>
            </div>

            {/* Tips */}
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">
                {isAr ? '💡 نصائح سريعة' : '💡 Quick Tips'}
              </h3>
              <ul className="space-y-1.5 text-muted-foreground">
                {(isAr ? [
                  '🖱️ انقر مرتين على أي عنوان لتعديله مباشرة دون فتح نافذة.',
                  '↕️ اسحب وأفلت لإعادة ترتيب المواضيع والأقسام والدروس.',
                  '⋯ استخدم قائمة "المزيد" للتعديل أو الحذف.',
                  '🔄 يمكنك تغيير نوع الدرس من القائمة المنسدلة بجانب كل درس.',
                  '✏️ انقر على أيقونة القلم لفتح محرر المحتوى.',
                  '📊 شارة العدد بجانب كل موضوع/قسم تعرض عدد العناصر الفرعية.',
                ] : [
                  '🖱️ Double-click any title to rename it inline without opening a dialog.',
                  '↕️ Drag & drop to reorder topics, sections, and lessons.',
                  '⋯ Use the "More" menu (⋯) to edit or delete any item.',
                  '🔄 Change a lesson type from the dropdown next to each lesson.',
                  '✏️ Click the pencil icon to open the content builder.',
                  '📊 Count badges next to topics/sections show child item counts.',
                ]).map((tip, i) => (
                  <li key={i} className="text-xs leading-relaxed">{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDetail;
