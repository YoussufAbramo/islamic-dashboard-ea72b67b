import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Signal, Plus, Pencil, Trash2, Search } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Level {
  id: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  sort_order: number;
  created_at: string;
}

const CourseLevels = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Level | null>(null);
  const [form, setForm] = useState({ title: '', title_ar: '', description: '', description_ar: '' });

  const { data: levels = [], isLoading } = useQuery({
    queryKey: ['course_levels'],
    queryFn: async () => {
      const { data, error } = await supabase.from('course_levels').select('*').order('sort_order');
      if (error) throw error;
      return data as Level[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from('course_levels').update(form).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('course_levels').insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course_levels'] });
      toast.success(isAr ? 'تم الحفظ' : 'Saved successfully');
      closeDialog();
    },
    onError: () => toast.error(isAr ? 'حدث خطأ' : 'An error occurred'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('course_levels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course_levels'] });
      toast.success(isAr ? 'تم الحذف' : 'Deleted');
      setDeleteId(null);
    },
    onError: () => toast.error(isAr ? 'حدث خطأ' : 'An error occurred'),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', title_ar: '', description: '', description_ar: '' });
    setDialogOpen(true);
  };

  const openEdit = (l: Level) => {
    setEditing(l);
    setForm({ title: l.title, title_ar: l.title_ar, description: l.description, description_ar: l.description_ar });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const filtered = levels.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.title_ar?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">{isAr ? 'المستويات' : 'Levels'}</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 w-56" />
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 me-2" />{isAr ? 'إضافة مستوى' : 'Add Level'}</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Signal} title={isAr ? 'لم يتم إنشاء أي مستويات بعد' : 'No levels yet'} description={isAr ? 'أنشئ مستوى لتحديد صعوبة الدورات' : 'Create levels to define course difficulty'} actionLabel={isAr ? 'إضافة مستوى' : 'Add Level'} onAction={openNew} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(l => (
            <Card key={l.id}>
              <CardContent className="pt-5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{isAr ? (l.title_ar || l.title) : l.title}</h3>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(l)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(l.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                {(isAr ? (l.description_ar || l.description) : l.description) && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{isAr ? (l.description_ar || l.description) : l.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? (isAr ? 'تعديل المستوى' : 'Edit Level') : (isAr ? 'إضافة مستوى' : 'Add Level')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{isAr ? 'العنوان (EN)' : 'Title (EN)'}</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>{isAr ? 'العنوان (AR)' : 'Title (AR)'}</Label><Input dir="rtl" value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{isAr ? 'الوصف (EN)' : 'Description (EN)'}</Label><Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="space-y-2"><Label>{isAr ? 'الوصف (AR)' : 'Description (AR)'}</Label><Textarea dir="rtl" rows={3} value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.title.trim() || saveMutation.isPending}>{isAr ? 'حفظ' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'تأكيد الحذف' : 'Confirm Delete'}</AlertDialogTitle>
            <AlertDialogDescription>{isAr ? 'هل أنت متأكد من حذف هذا المستوى؟' : 'Are you sure you want to delete this level?'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>{isAr ? 'حذف' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseLevels;
