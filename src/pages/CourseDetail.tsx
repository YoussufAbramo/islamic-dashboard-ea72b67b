import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const lessonTypes = [
  { value: 'table_of_content', label: 'Table of Content' },
  { value: 'revision', label: 'Revision' },
  { value: 'read_listen', label: 'Read & Listen' },
  { value: 'memorization', label: 'Memorization' },
  { value: 'exercise_text_match', label: 'Exercise: Text Match' },
  { value: 'exercise_choose_correct', label: 'Exercise: Choose Correct' },
  { value: 'exercise_choose_multiple', label: 'Exercise: Choose Multiple' },
  { value: 'exercise_rearrange', label: 'Exercise: Rearrange Words' },
  { value: 'exercise_missing_text', label: 'Exercise: Missing Text' },
  { value: 'exercise_true_false', label: 'Exercise: True/False' },
  { value: 'exercise_listen_choose', label: 'Exercise: Listen & Choose' },
  { value: 'homework', label: 'Homework' },
];

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { role } = useAuth();
  const canEdit = role === 'admin' || role === 'teacher';

  const [course, setCourse] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [lessons, setLessons] = useState<Record<string, any[]>>({});
  const [sectionDialog, setSectionDialog] = useState(false);
  const [lessonDialog, setLessonDialog] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState({ title: '', title_ar: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', title_ar: '', lesson_type: 'read_listen' });

  const fetchCourse = async () => {
    const { data } = await supabase.from('courses').select('*').eq('id', id).single();
    setCourse(data);
  };

  const fetchSections = async () => {
    const { data } = await supabase.from('course_sections').select('*').eq('course_id', id).order('sort_order');
    setSections(data || []);
    // Fetch lessons for each section
    if (data) {
      const lessonMap: Record<string, any[]> = {};
      for (const section of data) {
        const { data: lessonData } = await supabase.from('lessons').select('*').eq('section_id', section.id).order('sort_order');
        lessonMap[section.id] = lessonData || [];
      }
      setLessons(lessonMap);
    }
  };

  useEffect(() => { fetchCourse(); fetchSections(); }, [id]);

  const addSection = async () => {
    await supabase.from('course_sections').insert({ ...sectionForm, course_id: id, sort_order: sections.length });
    setSectionDialog(false);
    setSectionForm({ title: '', title_ar: '' });
    fetchSections();
    toast.success('Section added');
  };

  const addLesson = async () => {
    if (!activeSectionId) return;
    const currentLessons = lessons[activeSectionId] || [];
    await supabase.from('lessons').insert({ ...lessonForm, section_id: activeSectionId, sort_order: currentLessons.length });
    setLessonDialog(false);
    setLessonForm({ title: '', title_ar: '', lesson_type: 'read_listen' });
    fetchSections();
    toast.success('Lesson added');
  };

  const deleteSection = async (sectionId: string) => {
    await supabase.from('course_sections').delete().eq('id', sectionId);
    fetchSections();
    toast.success('Section deleted');
  };

  const deleteLesson = async (lessonId: string) => {
    await supabase.from('lessons').delete().eq('id', lessonId);
    fetchSections();
    toast.success('Lesson deleted');
  };

  if (!course) return <div className="text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => navigate('/dashboard/courses')}><ArrowLeft className="h-4 w-4 me-2" />{t('common.back')}</Button>

      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' && course.title_ar ? course.title_ar : course.title}</CardTitle>
          <p className="text-muted-foreground">{language === 'ar' && course.description_ar ? course.description_ar : course.description}</p>
        </CardHeader>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('courses.sections')}</h2>
        {canEdit && (
          <Dialog open={sectionDialog} onOpenChange={setSectionDialog}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 me-2" />{t('courses.addSection')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('courses.addSection')}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title (EN)</Label><Input value={sectionForm.title} onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })} /></div>
                <div><Label>Title (AR)</Label><Input value={sectionForm.title_ar} onChange={(e) => setSectionForm({ ...sectionForm, title_ar: e.target.value })} dir="rtl" /></div>
                <Button onClick={addSection} className="w-full">{t('common.save')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Accordion type="multiple" className="space-y-2">
        {sections.map((section) => (
          <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <span>{language === 'ar' && section.title_ar ? section.title_ar : section.title}</span>
                <Badge variant="secondary">{(lessons[section.id] || []).length} {t('courses.lessons')}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {(lessons[section.id] || []).map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div>
                      <span className="font-medium">{language === 'ar' && lesson.title_ar ? lesson.title_ar : lesson.title}</span>
                      <Badge variant="outline" className="ms-2 text-xs">{lessonTypes.find(lt => lt.value === lesson.lesson_type)?.label || lesson.lesson_type}</Badge>
                    </div>
                    {canEdit && (
                      <Button variant="ghost" size="icon" onClick={() => deleteLesson(lesson.id)}><Trash2 className="h-3 w-3" /></Button>
                    )}
                  </div>
                ))}
                {canEdit && (
                  <Dialog open={lessonDialog && activeSectionId === section.id} onOpenChange={(o) => { setLessonDialog(o); if (o) setActiveSectionId(section.id); }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setActiveSectionId(section.id)}>
                        <Plus className="h-3 w-3 me-1" />{t('courses.addLesson')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>{t('courses.addLesson')}</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div><Label>Title (EN)</Label><Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} /></div>
                        <div><Label>Title (AR)</Label><Input value={lessonForm.title_ar} onChange={(e) => setLessonForm({ ...lessonForm, title_ar: e.target.value })} dir="rtl" /></div>
                        <div>
                          <Label>{t('courses.lessonType')}</Label>
                          <Select value={lessonForm.lesson_type} onValueChange={(v) => setLessonForm({ ...lessonForm, lesson_type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {lessonTypes.map((lt) => <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={addLesson} className="w-full">{t('common.save')}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {canEdit && (
                <div className="pt-2">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteSection(section.id)}>
                    <Trash2 className="h-3 w-3 me-1" />{t('common.delete')} {t('courses.sections')}
                  </Button>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {sections.length === 0 && <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>}
    </div>
  );
};

export default CourseDetail;
