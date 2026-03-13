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
  const [lessonForm, setLessonForm] = useState({ title: '', title_ar: '', lesson_type: 'read_listen' });

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
        lesson_type: lessonForm.lesson_type as any,
      }).eq('id', editingLessonId);
      setEditingLessonId(null);
      toast.success(isAr ? 'تم تحديث الدرس' : 'Lesson updated');
    } else {
      if (!activeSectionId) return;
      const currentLessons = lessonItems[activeSectionId] || [];
      await supabase.from('lessons').insert([{
        title: lessonForm.title,
        title_ar: lessonForm.title_ar,
        lesson_type: lessonForm.lesson_type as any,
        section_id: activeSectionId,
        sort_order: currentLessons.length,
      }]);
      toast.success(isAr ? 'تمت إضافة الدرس' : 'Lesson added');
    }
    setLessonDialog(false);
    setLessonForm({ title: '', title_ar: '', lesson_type: 'read_listen' });
    fetchHierarchy();
  };

  const openEditLesson = (lesson: any, sectionId: string) => {
    setEditingLessonId(lesson.id);
    setActiveSectionId(sectionId);
    setLessonForm({ title: lesson.title, title_ar: lesson.title_ar || '', lesson_type: lesson.lesson_type });
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
                    <Settings2 className="h-4 w-4" />
                  </Button>
                )}
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
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => navigate(`/dashboard/courses/${id}/learn`)}
                >
                  <GraduationCap className="h-4 w-4" />
                  {isAr ? 'ابدأ التعلم' : 'Learn Now'}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

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
          <Button size="sm" onClick={() => { setEditingTopicId(null); setTopicForm({ title: '', title_ar: '' }); setTopicDialog(true); }}>
            <Plus className="h-4 w-4 me-2" />{t('courses.addTopic')}
          </Button>
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
                      <span className="font-semibold truncate">{isAr && topic.title_ar ? topic.title_ar : topic.title}</span>
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
                  <CollapsibleContent>
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
                                      <span className="text-sm font-medium truncate">{isAr && section.title_ar ? section.title_ar : section.title}</span>
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
                                  <CollapsibleContent>
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
                                                  <span className="text-sm truncate">{isAr && lesson.title_ar ? lesson.title_ar : lesson.title}</span>
                                                  <Badge variant="outline" className="text-[10px] font-normal shrink-0 bg-background">
                                                    {allContentTypes.find(ct => ct.value === lesson.lesson_type)?.label || lesson.lesson_type}
                                                  </Badge>
                                                </div>
                                                {canEdit && (
                                                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/lesson:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={(e) => { e.stopPropagation(); openEditLesson(lesson, section.id); }}>
                                                      <Settings2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={(e) => { e.stopPropagation(); }}>
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
    </div>
  );
};

export default CourseDetail;
