import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Plus, FolderTree, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { TableSkeleton } from '@/components/PageSkeleton';
import EmptyState from '@/components/EmptyState';
import { ACTION_BTN, ACTION_BTN_DESTRUCTIVE, ACTION_ICON } from '@/lib/actionBtnClass';

interface ExpenseCategory {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const ExpenseCategories = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ExpenseCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', title_ar: '', description: '', description_ar: '', color: '#6366f1', is_active: true });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('expense_categories' as any)
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) notifyError({ error, isAr, rawMessage: error.message });
    setCategories((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ title: '', title_ar: '', description: '', description_ar: '', color: '#6366f1', is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (cat: ExpenseCategory) => {
    setEditItem(cat);
    setForm({
      title: cat.title,
      title_ar: cat.title_ar || '',
      description: cat.description || '',
      description_ar: cat.description_ar || '',
      color: cat.color,
      is_active: cat.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error(isAr ? 'يرجى إدخال اسم التصنيف' : 'Please enter a category name');
      return;
    }
    setSaving(true);
    if (editItem) {
      const { error } = await supabase
        .from('expense_categories' as any)
        .update({
          title: form.title,
          title_ar: form.title_ar || null,
          description: form.description,
          description_ar: form.description_ar,
          color: form.color,
          is_active: form.is_active,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', editItem.id);
      if (error) { notifyError({ error, isAr, rawMessage: error.message }); setSaving(false); return; }
      toast.success(isAr ? 'تم التحديث' : 'Updated successfully');
    } else {
      const { error } = await supabase
        .from('expense_categories' as any)
        .insert({
          title: form.title,
          title_ar: form.title_ar || null,
          description: form.description,
          description_ar: form.description_ar,
          color: form.color,
          is_active: form.is_active,
          sort_order: categories.length,
        } as any);
      if (error) { notifyError({ error, isAr, rawMessage: error.message }); setSaving(false); return; }
      toast.success(isAr ? 'تم الإنشاء' : 'Created successfully');
    }
    setSaving(false);
    setDialogOpen(false);
    fetchCategories();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('expense_categories' as any).delete().eq('id', deleteTarget);
    if (error) { notifyError({ error, isAr, rawMessage: error.message }); return; }
    toast.success(isAr ? 'تم الحذف' : 'Deleted successfully');
    setDeleteTarget(null);
    fetchCategories();
  };

  if (loading) return <TableSkeleton rows={4} cols={3} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderTree className="h-6 w-6 text-primary" />
            {isAr ? 'تصنيفات المصروفات' : 'Expense Categories'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'إدارة تصنيفات المصروفات' : 'Manage expense categories'}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 me-2" />
          {isAr ? 'تصنيف جديد' : 'New Category'}
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title={isAr ? 'لا توجد تصنيفات' : 'No Categories'}
          description={isAr ? 'ابدأ بإنشاء تصنيف للمصروفات' : 'Start by creating an expense category'}
        />
      ) : (
        <div className="grid gap-3">
          {categories.map(cat => (
            <Card key={cat.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat.color}20` }}>
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{isAr ? cat.title_ar || cat.title : cat.title}</p>
                      {!cat.is_active && (
                        <Badge variant="secondary" className="text-[10px]">{isAr ? 'معطل' : 'Inactive'}</Badge>
                      )}
                    </div>
                    {(isAr ? cat.description_ar : cat.description) && (
                      <p className="text-xs text-muted-foreground">{isAr ? cat.description_ar || cat.description : cat.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className={ACTION_BTN} onClick={() => openEdit(cat)}>
                    <Pencil className={ACTION_ICON} />
                  </Button>
                  <Button variant="ghost" size="icon" className={ACTION_BTN_DESTRUCTIVE} onClick={() => setDeleteTarget(cat.id)}>
                    <Trash2 className={ACTION_ICON} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? (isAr ? 'تعديل التصنيف' : 'Edit Category') : (isAr ? 'تصنيف جديد' : 'New Category')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Title (EN)</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Title (AR)</Label><Input dir="rtl" value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>{isAr ? 'الوصف' : 'Description'}</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>{isAr ? 'الوصف بالعربية' : 'Description (AR)'}</Label><Input dir="rtl" value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <Label>{isAr ? 'اللون' : 'Color'}</Label>
                <Input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="h-10 w-16 p-1 cursor-pointer" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <Label className="text-sm">{isAr ? 'نشط' : 'Active'}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'تأكيد الحذف' : 'Confirm Delete'}</AlertDialogTitle>
            <AlertDialogDescription>{isAr ? 'هل أنت متأكد من حذف هذا التصنيف؟' : 'Are you sure you want to delete this category?'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{isAr ? 'حذف' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExpenseCategories;
