import { useState, useEffect } from 'react';
import { ACTION_BTN, ACTION_BTN_DESTRUCTIVE, ACTION_ICON } from '@/lib/actionBtnClass';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Save, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { TableSkeleton } from '@/components/PageSkeleton';
import EmptyState from '@/components/EmptyState';

interface Department {
  id: string;
  name: string;
  name_ar: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const SupportDepartments = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', name_ar: '', sort_order: 0, is_active: true });
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('support_departments').select('*').order('sort_order');
    if (error) notifyError({ error, isAr, rawMessage: error.message });
    setDepartments((data as Department[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', name_ar: '', sort_order: departments.length, is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setForm({ name: dept.name, name_ar: dept.name_ar || '', sort_order: dept.sort_order, is_active: dept.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('support_departments').update(form).eq('id', editing.id);
      if (error) { notifyError({ error, isAr, rawMessage: error.message }); setSaving(false); return; }
      toast.success(isAr ? 'تم التحديث' : 'Updated');
    } else {
      const { error } = await supabase.from('support_departments').insert(form);
      if (error) { notifyError({ error, isAr, rawMessage: error.message }); setSaving(false); return; }
      toast.success(isAr ? 'تمت الإضافة' : 'Added');
    }
    setSaving(false);
    setDialogOpen(false);
    fetch();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('support_departments').delete().eq('id', id);
    if (error) { notifyError({ error, isAr, rawMessage: error.message }); return; }
    toast.success(isAr ? 'تم الحذف' : 'Deleted');
    fetch();
  };

  if (loading) return <TableSkeleton rows={4} cols={4} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {isAr ? 'الأقسام' : 'Departments'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'إدارة أقسام تذاكر الدعم' : 'Manage support ticket departments'}
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 me-1" />{isAr ? 'إضافة' : 'Add'}
        </Button>
      </div>

      {departments.length === 0 ? (
        <EmptyState
          title={isAr ? 'لا توجد أقسام' : 'No departments'}
          description={isAr ? 'أنشئ قسم لتصنيف التذاكر' : 'Create a department to categorize tickets'}
          actionLabel={isAr ? 'إضافة قسم' : 'Add Department'}
          onAction={openCreate}
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? 'الاسم' : 'Name'}</TableHead>
                <TableHead>{isAr ? 'الاسم بالعربية' : 'Name (AR)'}</TableHead>
                <TableHead>{isAr ? 'الترتيب' : 'Order'}</TableHead>
                <TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map(dept => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell dir="rtl">{dept.name_ar || '—'}</TableCell>
                  <TableCell>{dept.sort_order}</TableCell>
                  <TableCell>
                    <Badge variant={dept.is_active ? 'default' : 'secondary'}>
                      {dept.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطل' : 'Inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className={ACTION_BTN} onClick={() => openEdit(dept)}>
                        <Pencil className={ACTION_ICON} />
                      </Button>
                      <Button variant="ghost" size="icon" className={ACTION_BTN_DESTRUCTIVE} onClick={() => handleDelete(dept.id)}>
                        <Trash2 className={ACTION_ICON} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? (isAr ? 'تعديل القسم' : 'Edit Department') : (isAr ? 'إضافة قسم' : 'Add Department')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Name (EN)</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Name (AR)</Label><Input dir="rtl" value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>{isAr ? 'الترتيب' : 'Sort Order'}</Label><Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} /></div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <Label>{isAr ? 'نشط' : 'Active'}</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                <Save className="h-4 w-4 me-1" />{isAr ? 'حفظ' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportDepartments;
