import { useState, useEffect } from 'react';
import { usePagination } from '@/hooks/use-pagination';
import PaginationControls from '@/components/PaginationControls';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Plus } from 'lucide-react';
import { toast } from 'sonner';

const Students = () => {
  const { t, language } = useLanguage();
  const { role } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Add student dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', email: '', password: '', phone: '' });
  const [addLoading, setAddLoading] = useState(false);

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('*, profiles:students_user_id_profiles_fkey(full_name, phone, email)');
    setStudents(data || []);
  };

  useEffect(() => { fetchStudents(); }, []);

  const viewDetails = async (student: any) => {
    setSelected(student);
    setProfile(student.profiles);
    setEditForm({ lesson_duration: student.lesson_duration, weekly_repeat: student.weekly_repeat });
    const { data } = await supabase.from('subscriptions').select('*, courses:course_id(title)').eq('student_id', student.id);
    setSubscriptions(data || []);
    setDetailOpen(true);
    setEditing(false);
  };

  const saveEdit = async () => {
    await supabase.from('students').update(editForm).eq('id', selected.id);
    toast.success(language === 'ar' ? 'تم تحديث الطالب' : 'Student updated');
    setEditing(false);
    fetchStudents();
  };

  const handleAddStudent = async () => {
    if (!addForm.email || !addForm.password || !addForm.full_name) {
      toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    setAddLoading(true);
    const { error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'create', role: 'student', email: addForm.email, password: addForm.password, full_name: addForm.full_name, phone: addForm.phone },
    });
    setAddLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(language === 'ar' ? 'تم إضافة الطالب' : 'Student added successfully');
      setAddOpen(false);
      setAddForm({ full_name: '', email: '', password: '', phone: '' });
      fetchStudents();
    }
  };

  const filtered = students.filter((s) => {
    const name = s.profiles?.full_name || '';
    const email = s.profiles?.email || '';
    return name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold shrink-0">{t('students.title')}</h1>
        <div className="flex items-center gap-2 ms-auto">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 w-48 sm:w-64" />
          </div>
          {role === 'admin' && (
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 me-2" />
              {language === 'ar' ? 'إضافة طالب' : 'Add Student'}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('students.name')}</TableHead>
              <TableHead>{t('students.phone')}</TableHead>
              <TableHead>{t('students.email')}</TableHead>
              <TableHead>{t('students.lessonDuration')}</TableHead>
              <TableHead>{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.profiles?.full_name}</TableCell>
                <TableCell>{student.profiles?.phone}</TableCell>
                <TableCell>{student.profiles?.email}</TableCell>
                <TableCell>{student.lesson_duration} {t('common.minutes')}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => viewDetails(student)}><Eye className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('students.details')}</DialogTitle></DialogHeader>
          {selected && profile && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t('students.name')}</Label><p className="font-medium">{profile.full_name}</p></div>
                <div><Label>{t('students.email')}</Label><p>{profile.email}</p></div>
                <div><Label>{t('students.phone')}</Label><p>{profile.phone}</p></div>
              </div>
              {editing ? (
                <div className="space-y-3 border-t pt-3">
                  <div><Label>{t('students.lessonDuration')} ({t('common.minutes')})</Label>
                    <Input type="number" value={editForm.lesson_duration} onChange={(e) => setEditForm({ ...editForm, lesson_duration: parseInt(e.target.value) })} /></div>
                  <div><Label>{t('students.weeklyRepeat')}</Label>
                    <Input type="number" value={editForm.weekly_repeat} onChange={(e) => setEditForm({ ...editForm, weekly_repeat: parseInt(e.target.value) })} /></div>
                  <div className="flex gap-2">
                    <Button onClick={saveEdit}>{t('common.save')}</Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>{t('common.cancel')}</Button>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>{t('students.lessonDuration')}</Label><p>{selected.lesson_duration} {t('common.minutes')}</p></div>
                    <div><Label>{t('students.weeklyRepeat')}</Label><p>{selected.weekly_repeat}x</p></div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setEditing(true)}>{t('common.edit')}</Button>
                </div>
              )}
              <div className="border-t pt-3">
                <h3 className="font-semibold mb-2">{t('students.subscribedCourses')}</h3>
                {subscriptions.length > 0 ? (
                  <div className="space-y-2">
                    {subscriptions.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <span>{sub.courses?.title}</span>
                        <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>{sub.status}</Badge>
                        <span className="text-sm text-muted-foreground">{sub.subscription_type}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground">{t('common.noData')}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add student dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{language === 'ar' ? 'إضافة طالب جديد' : 'Add New Student'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{t('auth.fullName')} *</Label><Input value={addForm.full_name} onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })} /></div>
            <div><Label>{t('auth.email')} *</Label><Input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} /></div>
            <div><Label>{t('auth.password')} *</Label><Input type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} placeholder={language === 'ar' ? '6 أحرف على الأقل' : 'Min 6 characters'} /></div>
            <div><Label>{t('auth.phone')}</Label><Input value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} /></div>
            <Button onClick={handleAddStudent} disabled={addLoading} className="w-full">
              {addLoading ? t('common.loading') : (language === 'ar' ? 'إضافة الطالب' : 'Add Student')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Students;
