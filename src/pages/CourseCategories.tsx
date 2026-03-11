import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FolderTree, Plus, Pencil, Trash2, Search, ChevronRight } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Category {
  id: string;
  parent_id: string | null;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  sort_order: number;
  created_at: string;
}

const CourseCategories = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ title: '', title_ar: '', description: '', description_ar: '', parent_id: '' });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['course_categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('course_categories').select('*').order('sort_order');
      if (error) throw error;
      return data as Category[];
    },
  });

  const parentCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories]);

  const childrenOf = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, parent_id: form.parent_id || null };
      if (editing) {
        const { error } = await supabase.from('course_categories').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('course_categories').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course_categories'] });
      toast.success(isAr ? 'تم الحفظ' : 'Saved successfully');
      closeDialog();
    },
    onError: () => toast.error(isAr ? 'حدث خطأ' : 'An error occurred'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('course_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course_categories'] });
      toast.success(isAr ? 'تم الحذف' : 'Deleted');
      setDeleteId(null);
    },
    onError: () => toast.error(isAr ? 'حدث خطأ' : 'An error occurred'),
  });

  const openNew = (parentId?: string) => {
    setEditing(null);
    setForm({ title: '', title_ar: '', description: '', description_ar: '', parent_id: parentId || '' });
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ title: c.title, title_ar: c.title_ar, description: c.description, description_ar: c.description_ar, parent_id: c.parent_id || '' });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const getLabel = (c: Category) => isAr ? (c.title_ar || c.title) : c.title;
  const getDesc = (c: Category) => isAr ? (c.description_ar || c.description) : c.description;

  const filtered = useMemo(() => {
    if (!search) return parentCategories;
    const q = search.toLowerCase();
    return parentCategories.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.title_ar?.toLowerCase().includes(q) ||
      childrenOf(p.id).some(ch => ch.title.toLowerCase().includes(q) || ch.title_ar?.toLowerCase().includes(q))
    );
  }, [parentCategories, search, categories]);

  const allEmpty = categories.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">{isAr ? 'التصنيفات' : 'Categories'}</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 w-56" />
          </div>
          <Button onClick={() => openNew()}><Plus className="h-4 w-4 me-2" />{isAr ? 'إضافة تصنيف' : 'Add Category'}</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
      ) : allEmpty ? (
        <EmptyState icon={FolderTree} title={isAr ? 'لم يتم إنشاء أي تصنيفات بعد' : 'No categories yet'} description={isAr ? 'أنشئ تصنيفاً لتنظيم الدورات' : 'Create categories to organize courses'} actionLabel={isAr ? 'إضافة تصنيف' : 'Add Category'} onAction={() => openNew()} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{isAr ? 'لا توجد نتائج' : 'No results'}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(parent => {
            const children = childrenOf(parent.id);
            return (
              <Card key={parent.id}>
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{getLabel(parent)}</h3>
                        <Badge variant="outline" className="text-xs">{isAr ? 'رئيسي' : 'Parent'}</Badge>
                      </div>
                      {getDesc(parent) && <p className="text-sm text-muted-foreground mt-1">{getDesc(parent)}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openNew(parent.id)} title={isAr ? 'إضافة فرعي' : 'Add Sub-category'}><Plus className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(parent)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(parent.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  {children.length > 0 && (
                    <div className="ms-4 border-s border-border ps-4 space-y-2">
                      {children.map(child => (
                        <div key={child.id} className="flex items-start justify-between gap-2 py-1">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div>
                              <span className="text-sm font-medium">{getLabel(child)}</span>
                              {getDesc(child) && <p className="text-xs text-muted-foreground">{getDesc(child)}</p>}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(child)}><Pencil className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setDeleteId(child.id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? (isAr ? 'تعديل التصنيف' : 'Edit Category') : (isAr ? 'إضافة تصنيف' : 'Add Category')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isAr ? 'التصنيف الرئيسي' : 'Parent Category'}</Label>
              <Select value={form.parent_id} onValueChange={v => setForm(f => ({ ...f, parent_id: v === '__none__' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder={isAr ? 'بدون (تصنيف رئيسي)' : 'None (Parent)'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{isAr ? 'بدون (تصنيف رئيسي)' : 'None (Parent)'}</SelectItem>
                  {parentCategories.filter(p => p.id !== editing?.id).map(p => (
                    <SelectItem key={p.id} value={p.id}>{getLabel(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <AlertDialogDescription>{isAr ? 'هل أنت متأكد؟ سيتم فصل التصنيفات الفرعية.' : 'Are you sure? Child categories will be unlinked.'}</AlertDialogDescription>
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

export default CourseCategories;
