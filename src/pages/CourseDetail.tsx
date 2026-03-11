import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowLeft, Trash2, BookOpen, Clock, Signal, FolderTree, Layers, FileText, Pencil } from 'lucide-react';
import { toast } from 'sonner';

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
  // Level 1: Lessons (course_sections)
  const [lessons, setLessons] = useState<any[]>([]);
  // Level 2: Sections (lesson_sections) keyed by course_section_id
  const [sections, setSections] = useState<Record<string, any[]>>({});
  // Level 3: Content (lessons table) keyed by lesson_section_id
  const [contents, setContents] = useState<Record<string, any[]>>({});

  // Dialog states
  const [lessonDialog, setLessonDialog] = useState(false);
  const [sectionDialog, setSectionDialog] = useState(false);
  const [contentDialog, setContentDialog] = useState(false);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

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
    // Level 1: Lessons (course_sections)
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

    // Level 2: Sections (lesson_sections)
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

    // Level 3: Content (lessons table)
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

  // CRUD: Lessons (course_sections)
  const addLesson = async () => {
    await supabase.from('course_sections').insert({ ...lessonForm, course_id: id, sort_order: lessons.length });
    setLessonDialog(false);
    setLessonForm({ title: '', title_ar: '' });
    fetchHierarchy();
    toast.success(isAr ? 'تمت إضافة الدرس' : 'Lesson added');
  };

  const deleteLesson = async (lessonId: string) => {
    await supabase.from('course_sections').delete().eq('id', lessonId);
    fetchHierarchy();
    toast.success(isAr ? 'تم حذف الدرس' : 'Lesson deleted');
  };

  // CRUD: Sections (lesson_sections)
  const addSection = async () => {
    if (!activeLessonId) return;
    const currentSections = sections[activeLessonId] || [];
    await supabase.from('lesson_sections' as any).insert([{
      course_section_id: activeLessonId,
      title: sectionForm.title,
      title_ar: sectionForm.title_ar,
      sort_order: currentSections.length,
    }] as any);
    setSectionDialog(false);
    setSectionForm({ title: '', title_ar: '' });
    fetchHierarchy();
    toast.success(isAr ? 'تمت إضافة القسم' : 'Section added');
  };

  const deleteSection = async (sectionId: string) => {
    await supabase.from('lesson_sections' as any).delete().eq('id', sectionId);
    fetchHierarchy();
    toast.success(isAr ? 'تم حذف القسم' : 'Section deleted');
  };

  // CRUD: Content (lessons)
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

  const deleteContent = async (contentId: string) => {
    await supabase.from('lessons').delete().eq('id', contentId);
    fetchHierarchy();
    toast.success(isAr ? 'تم حذف المحتوى' : 'Content deleted');
  };

  if (!course) return <div className="text-muted-foreground">{t('common.loading')}</div>;

  const categoryLabel = categories.find(c => c.id === course.category_id);
  const skillLabel = levels.find(l => l.id === course.level_id);
  const trackLabel = tracks.find(t => t.id === course.track_id);

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

      {/* Level 1: Lessons */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('courses.lessons')}</h2>
        {canEdit && (
          <Dialog open={lessonDialog} onOpenChange={setLessonDialog}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 me-2" />{t('courses.addLesson')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('courses.addLesson')}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Title (EN)</Label><Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} /></div>
                  <div><Label>Title (AR)</Label><Input value={lessonForm.title_ar} onChange={(e) => setLessonForm({ ...lessonForm, title_ar: e.target.value })} dir="rtl" className="text-right" /></div>
                </div>
                <Button onClick={addLesson} className="w-full">{t('common.save')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Accordion type="multiple" className="space-y-2">
        {lessons.map((lesson) => (
          <AccordionItem key={lesson.id} value={lesson.id} className="border rounded-lg px-4">
            <div className="flex items-center">
              <AccordionTrigger className="hover:no-underline flex-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>{isAr && lesson.title_ar ? lesson.title_ar : lesson.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {(sections[lesson.id] || []).length} {t('courses.sections')}
                  </Badge>
                </div>
              </AccordionTrigger>
              {canEdit && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={(e) => { e.stopPropagation(); deleteLesson(lesson.id); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {/* Level 2: Sections inside this Lesson */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {t('courses.sections')}
                  </h3>
                  {canEdit && (
                    <Dialog open={sectionDialog && activeLessonId === lesson.id} onOpenChange={(o) => { setSectionDialog(o); if (o) setActiveLessonId(lesson.id); }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setActiveLessonId(lesson.id)}>
                          <Plus className="h-3 w-3 me-1" />{t('courses.addSection')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>{t('courses.addSection')}</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div><Label>Title (EN)</Label><Input value={sectionForm.title} onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })} /></div>
                            <div><Label>Title (AR)</Label><Input value={sectionForm.title_ar} onChange={(e) => setSectionForm({ ...sectionForm, title_ar: e.target.value })} dir="rtl" className="text-right" /></div>
                          </div>
                          <Button onClick={addSection} className="w-full">{t('common.save')}</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {(sections[lesson.id] || []).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">{t('common.noData')}</p>
                )}

                <Accordion type="multiple" className="space-y-1">
                  {(sections[lesson.id] || []).map((section: any) => (
                    <AccordionItem key={section.id} value={section.id} className="border rounded-md px-3 bg-muted/30">
                      <div className="flex items-center">
                        <AccordionTrigger className="hover:no-underline py-3 text-sm flex-1">
                          <div className="flex items-center gap-2">
                            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{isAr && section.title_ar ? section.title_ar : section.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {(contents[section.id] || []).length} {t('courses.content')}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        {canEdit && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <AccordionContent>
                        <div className="space-y-2 pt-1">
                          {/* Level 3: Content items */}
                          {(contents[section.id] || []).map((content: any) => (
                            <div key={content.id} className="flex items-center justify-between p-2 rounded bg-background border">
                              <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="font-medium text-sm">{isAr && content.title_ar ? content.title_ar : content.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {allContentTypes.find(ct => ct.value === content.lesson_type)?.label || content.lesson_type}
                                </Badge>
                              </div>
                              {canEdit && (
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditContent(content, section.id)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteContent(content.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}

                          {canEdit && (
                            <Dialog open={contentDialog && activeSectionId === section.id} onOpenChange={(o) => { setContentDialog(o); if (o) { setActiveSectionId(section.id); } if (!o) { setEditingContentId(null); setContentForm({ title: '', title_ar: '', lesson_type: 'read_listen' }); } }}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full" onClick={() => { setActiveSectionId(section.id); setEditingContentId(null); setContentForm({ title: '', title_ar: '', lesson_type: 'read_listen' }); }}>
                                  <Plus className="h-3 w-3 me-1" />{t('courses.addContent')}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader><DialogTitle>{editingContentId ? (isAr ? 'تعديل المحتوى' : 'Edit Content') : t('courses.addContent')}</DialogTitle></DialogHeader>
                                <div className="space-y-3">
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
                                  <Button onClick={addContent} className="w-full">{t('common.save')}</Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>

                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {lessons.length === 0 && <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>}
    </div>
  );
};

export default CourseDetail;
