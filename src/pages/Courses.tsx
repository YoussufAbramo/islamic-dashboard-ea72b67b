import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Edit, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const lessonTypeLabels: Record<string, string> = {
  table_of_content: 'Table of Content',
  revision: 'Revision',
  read_listen: 'Read & Listen',
  memorization: 'Memorization',
  exercise_text_match: 'Exercise: Text Match',
  exercise_choose_correct: 'Exercise: Choose Correct',
  exercise_choose_multiple: 'Exercise: Choose Multiple',
  exercise_rearrange: 'Exercise: Rearrange',
  exercise_missing_text: 'Exercise: Missing Text',
  exercise_true_false: 'Exercise: True/False',
  exercise_listen_choose: 'Exercise: Listen & Choose',
  homework: 'Homework',
};

const Courses = () => {
  const { t, language } = useLanguage();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [form, setForm] = useState({ title: '', title_ar: '', description: '', description_ar: '', status: 'draft' });

  const canEdit = role === 'admin' || role === 'teacher';

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    setCourses(data || []);
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleSave = async () => {
    if (editCourse) {
      await supabase.from('courses').update(form).eq('id', editCourse.id);
      toast.success('Course updated');
    } else {
      await supabase.from('courses').insert(form);
      toast.success('Course created');
    }
    setDialogOpen(false);
    setEditCourse(null);
    setForm({ title: '', title_ar: '', description: '', description_ar: '', status: 'draft' });
    fetchCourses();
  };

  const openEdit = (course: any) => {
    setEditCourse(course);
    setForm({ title: course.title, title_ar: course.title_ar, description: course.description, description_ar: course.description_ar, status: course.status });
    setDialogOpen(true);
  };

  const filtered = courses.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()) || c.title_ar?.includes(search));
  const statusColor: Record<string, string> = { draft: 'secondary', published: 'default', archived: 'outline' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold shrink-0">{t('courses.title')}</h1>
        <div className="flex items-center gap-2 ms-auto">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 w-48 sm:w-64" />
          </div>
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditCourse(null); setForm({ title: '', title_ar: '', description: '', description_ar: '', status: 'draft' }); } }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 me-2" />{t('courses.create')}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{editCourse ? t('courses.edit') : t('courses.create')}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>{t('courses.name')} (EN)</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                  <div><Label>{t('courses.name')} (AR)</Label><Input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} dir="rtl" /></div>
                  <div><Label>{t('courses.description')} (EN)</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                  <div><Label>{t('courses.description')} (AR)</Label><Textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} dir="rtl" /></div>
                  <div>
                    <Label>{t('courses.status')}</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">{t('courses.draft')}</SelectItem>
                        <SelectItem value="published">{t('courses.published')}</SelectItem>
                        <SelectItem value="archived">{t('courses.archived')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSave} className="w-full">{t('common.save')}</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('courses.name')}</TableHead>
              <TableHead>{t('courses.status')}</TableHead>
              <TableHead>{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{language === 'ar' && course.title_ar ? course.title_ar : course.title}</TableCell>
                <TableCell><Badge variant={statusColor[course.status] as any}>{t(`courses.${course.status}`)}</Badge></TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/courses/${course.id}`)}><Eye className="h-4 w-4" /></Button>
                  {canEdit && <Button variant="ghost" size="icon" onClick={() => openEdit(course)}><Edit className="h-4 w-4" /></Button>}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Courses;
