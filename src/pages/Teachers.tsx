import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACTION_BTN, ACTION_BTN_DESTRUCTIVE, ACTION_ICON } from '@/lib/actionBtnClass';
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
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, Eye, Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { TableSkeleton } from '@/components/PageSkeleton';

const Teachers = () => {
  const { t, language } = useLanguage();
  const { role } = useAuth();
  const isAr = language === 'ar';
  const [teachers, setTeachers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', specialization: '', full_name: '', phone: '', email: '' });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', email: '', password: '', phone: '', specialization: '', bio: '' });
  const [addLoading, setAddLoading] = useState(false);

  const fetchTeachers = async () => {
    setLoading(true);
    const { data } = await supabase.from('teachers').select('*, profiles:teachers_user_id_profiles_fkey(full_name, phone, email)');
    setTeachers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTeachers(); }, []);

  const viewDetails = (teacher: any) => {
    setSelected(teacher);
    setProfile(teacher.profiles);
    setEditForm({ bio: teacher.bio || '', specialization: teacher.specialization || '', full_name: teacher.profiles?.full_name || '', phone: teacher.profiles?.phone || '', email: teacher.profiles?.email || '' });
    setDetailOpen(true);
    setEditing(false);
  };

  const saveEdit = async () => {
    await supabase.from('teachers').update({ bio: editForm.bio, specialization: editForm.specialization }).eq('id', selected.id);
    await supabase.from('profiles').update({ full_name: editForm.full_name, phone: editForm.phone, email: editForm.email }).eq('id', selected.user_id);
    toast.success(isAr ? 'تم تحديث المعلم' : 'Teacher updated');
    setEditing(false);
    fetchTeachers();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('teachers').delete().eq('id', deleteTarget);
    toast.success(isAr ? 'تم حذف المعلم' : 'Teacher deleted');
    setDeleteTarget(null);
    fetchTeachers();
  };

  const handleAddTeacher = async () => {
    if (!addForm.email || !addForm.password || !addForm.full_name) {
      notifyError({ error: 'VAL_REQUIRED_FIELDS', isAr });
      return;
    }
    setAddLoading(true);
    const { error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'create', role: 'teacher', email: addForm.email, password: addForm.password, full_name: addForm.full_name, phone: addForm.phone, specialization: addForm.specialization, bio: addForm.bio },
    });
    setAddLoading(false);
    if (error) { notifyError({ error, isAr, rawMessage: error.message }); } else {
      toast.success(isAr ? 'تم إضافة المعلم' : 'Teacher added successfully');
      setAddOpen(false);
      setAddForm({ full_name: '', email: '', password: '', phone: '', specialization: '', bio: '' });
      fetchTeachers();
    }
  };

  const filtered = teachers.filter((t) => {
    const name = t.profiles?.full_name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const { currentPage, totalPages, paginatedItems, setCurrentPage, totalItems, startIndex, endIndex } = usePagination(filtered);

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold shrink-0">{t('teachers.title')}</h1>
        <div className="flex items-center gap-2 ms-auto">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 w-48 sm:w-64" />
          </div>
          {role === 'admin' && (
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 me-2" />{isAr ? 'إضافة معلم' : 'Add Teacher'}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('teachers.name')}</TableHead>
              <TableHead>{t('teachers.phone')}</TableHead>
              <TableHead>{t('teachers.email')}</TableHead>
              <TableHead>{t('teachers.specialization')}</TableHead>
              <TableHead>{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell className="font-medium">{teacher.profiles?.full_name}</TableCell>
                <TableCell>{teacher.profiles?.phone}</TableCell>
                <TableCell>{teacher.profiles?.email}</TableCell>
                <TableCell>{teacher.specialization}</TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="icon" className={ACTION_BTN} onClick={() => viewDetails(teacher)}><Eye className={ACTION_ICON} /></Button>
                  <Button variant="ghost" size="icon" className={ACTION_BTN} onClick={() => { viewDetails(teacher); setTimeout(() => setEditing(true), 100); }}><Pencil className={ACTION_ICON} /></Button>
                  {role === 'admin' && <Button variant="ghost" size="icon" className={ACTION_BTN_DESTRUCTIVE} onClick={() => setDeleteTarget(teacher.id)}><Trash2 className={ACTION_ICON} /></Button>}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t('teachers.details')}</DialogTitle></DialogHeader>
          {selected && profile && (
            <div className="space-y-4">
              {editing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>{t('teachers.name')}</Label><Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} /></div>
                    <div><Label>{t('teachers.email')}</Label><Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
                    <div><Label>{t('teachers.phone')}</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                  </div>
                  <div><Label>{t('teachers.specialization')}</Label><Input value={editForm.specialization} onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })} /></div>
                  <div><Label>{t('teachers.bio')}</Label><Textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} /></div>
                  <div className="flex gap-2">
                    <Button onClick={saveEdit}>{t('common.save')}</Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>{t('common.cancel')}</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>{t('teachers.name')}</Label><p className="font-medium">{profile.full_name}</p></div>
                    <div><Label>{t('teachers.email')}</Label><p>{profile.email}</p></div>
                    <div><Label>{t('teachers.phone')}</Label><p>{profile.phone}</p></div>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div><Label>{t('teachers.specialization')}</Label><p>{selected.specialization || '-'}</p></div>
                    <div><Label>{t('teachers.bio')}</Label><p>{selected.bio || '-'}</p></div>
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>{t('common.edit')}</Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{isAr ? 'إضافة معلم جديد' : 'Add New Teacher'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{t('auth.fullName')} *</Label><Input value={addForm.full_name} onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })} /></div>
            <div><Label>{t('auth.email')} *</Label><Input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} /></div>
            <div><Label>{t('auth.password')} *</Label><Input type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} placeholder={isAr ? '6 أحرف على الأقل' : 'Min 6 characters'} /></div>
            <div><Label>{t('auth.phone')}</Label><Input value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} /></div>
            <div><Label>{t('teachers.specialization')}</Label><Input value={addForm.specialization} onChange={(e) => setAddForm({ ...addForm, specialization: e.target.value })} /></div>
            <div><Label>{t('teachers.bio')}</Label><Textarea value={addForm.bio} onChange={(e) => setAddForm({ ...addForm, bio: e.target.value })} /></div>
            <Button onClick={handleAddTeacher} disabled={addLoading} className="w-full">
              {addLoading ? t('common.loading') : (isAr ? 'إضافة المعلم' : 'Add Teacher')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'حذف المعلم' : 'Delete Teacher'}</AlertDialogTitle>
            <AlertDialogDescription>{isAr ? 'هل أنت متأكد؟ لا يمكن التراجع.' : 'Are you sure? This cannot be undone.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>{isAr ? 'حذف' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Teachers;
