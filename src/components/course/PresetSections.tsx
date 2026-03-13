import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BookTemplate, BookOpen, Mic, BookHeart, PenTool, ClipboardList, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PresetLesson {
  title: string;
  title_ar: string;
  lesson_type: string;
}

interface PresetTemplate {
  id: string;
  icon: React.ReactNode;
  title: string;
  title_ar: string;
  topicTitle: string;
  topicTitle_ar: string;
  lessons: PresetLesson[];
}

const presets: PresetTemplate[] = [
  {
    id: 'introduction',
    icon: <BookOpen className="h-4 w-4" />,
    title: 'Introduction',
    title_ar: 'مقدمة',
    topicTitle: 'Introduction',
    topicTitle_ar: 'مقدمة',
    lessons: [
      { title: 'Table of Content', title_ar: 'فهرس المحتويات', lesson_type: 'table_of_content' },
      { title: 'Goals', title_ar: 'الأهداف', lesson_type: 'read_listen' },
      { title: 'فضائل السورة', title_ar: 'فضائل السورة', lesson_type: 'read_listen' },
      { title: 'أسباب النزول', title_ar: 'أسباب النزول', lesson_type: 'read_listen' },
      { title: 'السياق النبوي', title_ar: 'السياق النبوي', lesson_type: 'read_listen' },
      { title: 'Other', title_ar: 'آخرى', lesson_type: 'read_listen' },
    ],
  },
  {
    id: 'ayat',
    icon: <Mic className="h-4 w-4" />,
    title: 'Ayat',
    title_ar: 'آيات',
    topicTitle: 'Ayat',
    topicTitle_ar: 'آيات',
    lessons: [
      { title: 'Listen & Recitation', title_ar: 'استمع وتلاوة', lesson_type: 'read_listen' },
      { title: "Repeat After Qaree'", title_ar: 'ردد بعد القارئ', lesson_type: 'read_listen' },
      { title: 'Memorization', title_ar: 'حفظ', lesson_type: 'memorization' },
      { title: 'Assessment', title_ar: 'تقييم', lesson_type: 'exercise_choose_correct' },
    ],
  },
  {
    id: 'tajweed',
    icon: <PenTool className="h-4 w-4" />,
    title: 'Tajweed',
    title_ar: 'تجويد',
    topicTitle: 'Tajweed',
    topicTitle_ar: 'تجويد',
    lessons: [
      { title: 'New Rule', title_ar: 'قاعدة جديدة', lesson_type: 'read_listen' },
      { title: 'Arabic Letters', title_ar: 'الحروف العربية', lesson_type: 'read_listen' },
      { title: 'Assessment', title_ar: 'تقييم', lesson_type: 'exercise_choose_correct' },
    ],
  },
  {
    id: 'tadabbur',
    icon: <BookHeart className="h-4 w-4" />,
    title: 'Tadabbur',
    title_ar: 'تدبّر',
    topicTitle: 'Tadabbur',
    topicTitle_ar: 'تدبّر',
    lessons: [
      { title: 'Explanation', title_ar: 'الشرح', lesson_type: 'read_listen' },
      { title: 'Tafsir', title_ar: 'التفسير', lesson_type: 'read_listen' },
      { title: 'الدروس المستفادة', title_ar: 'الدروس المستفادة', lesson_type: 'read_listen' },
      { title: 'أخلاقيات السورة', title_ar: 'أخلاقيات السورة', lesson_type: 'read_listen' },
    ],
  },
  {
    id: 'assessment',
    icon: <ClipboardList className="h-4 w-4" />,
    title: 'Assessment',
    title_ar: 'تقييم',
    topicTitle: 'Assessment',
    topicTitle_ar: 'تقييم',
    lessons: [
      { title: 'Match', title_ar: 'مطابقة', lesson_type: 'exercise_text_match' },
      { title: 'Re-order', title_ar: 'إعادة ترتيب', lesson_type: 'exercise_rearrange' },
      { title: 'Choose Multiple', title_ar: 'اختر متعدد', lesson_type: 'exercise_choose_multiple' },
    ],
  },
  {
    id: 'assignment',
    icon: <PenTool className="h-4 w-4" />,
    title: 'Assignment',
    title_ar: 'واجب',
    topicTitle: 'Assignment',
    topicTitle_ar: 'واجب',
    lessons: [
      { title: 'True / False', title_ar: 'صح أم خطأ', lesson_type: 'exercise_true_false' },
      { title: 'Choose Correct Answer', title_ar: 'اختر الإجابة الصحيحة', lesson_type: 'exercise_choose_correct' },
      { title: 'Missing Text', title_ar: 'النص المفقود', lesson_type: 'exercise_missing_text' },
    ],
  },
];

interface PresetSectionsProps {
  courseId: string;
  currentTopicCount: number;
  onInserted: () => void;
}

export default function PresetSections({ courseId, currentTopicCount, onInserted }: PresetSectionsProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleInsert = async () => {
    if (selected.size === 0) return;
    setLoading(true);

    try {
      let topicOffset = currentTopicCount;

      for (const presetId of Array.from(selected)) {
        const preset = presets.find(p => p.id === presetId);
        if (!preset) continue;

        // Create Topic (course_sections)
        const { data: topicData, error: topicErr } = await supabase
          .from('course_sections')
          .insert({
            course_id: courseId,
            title: preset.topicTitle,
            title_ar: preset.topicTitle_ar,
            sort_order: topicOffset,
          })
          .select('id')
          .single();

        if (topicErr || !topicData) {
          console.error('Topic insert error:', topicErr);
          continue;
        }

        // Create a default Section inside the topic
        const sectionTitle = preset.topicTitle;
        const sectionTitleAr = preset.topicTitle_ar;

        const { data: sectionData, error: secErr } = await supabase
          .from('lesson_sections' as any)
          .insert([{
            course_section_id: topicData.id,
            title: sectionTitle,
            title_ar: sectionTitleAr,
            sort_order: 0,
          }] as any)
          .select('id')
          .single();

        if (secErr || !sectionData) {
          console.error('Section insert error:', secErr);
          continue;
        }

        // Create Lessons
        const lessonInserts = preset.lessons.map((lesson, idx) => ({
          section_id: (sectionData as any).id,
          title: lesson.title,
          title_ar: lesson.title_ar,
          lesson_type: lesson.lesson_type as any,
          sort_order: idx,
        }));

        const { error: lesErr } = await supabase.from('lessons').insert(lessonInserts);
        if (lesErr) console.error('Lessons insert error:', lesErr);

        topicOffset++;
      }

      toast.success(isAr ? 'تم إدراج القوالب بنجاح' : 'Presets inserted successfully');
      setSelected(new Set());
      setOpen(false);
      onInserted();
    } catch (err) {
      console.error(err);
      toast.error(isAr ? 'حدث خطأ' : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <BookTemplate className="h-4 w-4" />
        {isAr ? 'قوالب جاهزة' : 'Presets'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookTemplate className="h-5 w-5 text-primary" />
              {isAr ? 'قوالب الأقسام الجاهزة' : 'Section Presets'}
            </DialogTitle>
            <DialogDescription>
              {isAr
                ? 'اختر قالباً أو أكثر لإدراجه تلقائياً في الدورة. يمكنك تعديل المحتوى بعد الإدراج.'
                : 'Select one or more presets to auto-generate topics with sections and lessons. Everything remains editable after insertion.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 mt-2">
            {presets.map(preset => {
              const isSelected = selected.has(preset.id);
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => toggle(preset.id)}
                  className={`w-full text-start rounded-lg border p-3 transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                    <div className="flex items-center gap-2 text-primary">
                      {preset.icon}
                      <span className="font-semibold text-foreground text-sm">
                        {isAr ? preset.title_ar : preset.title}
                      </span>
                    </div>
                    <Badge variant="secondary" className="ms-auto text-[10px]">
                      {preset.lessons.length} {isAr ? 'دروس' : 'lessons'}
                    </Badge>
                  </div>
                  <div className="mt-2 ms-8 flex flex-wrap gap-1">
                    {preset.lessons.map((l, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] font-normal">
                        {isAr ? l.title_ar : l.title}
                      </Badge>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t mt-2">
            <span className="text-xs text-muted-foreground">
              {selected.size} {isAr ? 'محدد' : 'selected'}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button size="sm" onClick={handleInsert} disabled={selected.size === 0 || loading}>
                {loading && <Loader2 className="h-4 w-4 me-1 animate-spin" />}
                {isAr ? 'إدراج' : 'Insert'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
