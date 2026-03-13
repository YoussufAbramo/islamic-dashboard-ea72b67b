import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Star } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ActionButton } from '@/components/ui/action-button';

interface Package {
  id: string;
  title: string;
  title_ar: string;
  subtitle: string;
  subtitle_ar: string;
  regular_price: number;
  sale_price: number | null;
  billing_cycle: string;
  max_teachers: number;
  max_students: number;
  max_courses: number;
  features: string[];
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

const emptyPackage: Omit<Package, 'id'> = {
  title: '', title_ar: '', subtitle: '', subtitle_ar: '',
  regular_price: 0, sale_price: null, billing_cycle: 'monthly',
  max_teachers: 1, max_students: 10, max_courses: 5,
  features: [], is_active: true, is_featured: false, sort_order: 0,
};

const SaaSPricingSettings = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [packages, setPackages] = useState<Package[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [form, setForm] = useState<Omit<Package, 'id'>>(emptyPackage);
  const [featureInput, setFeatureInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPackages = async () => {
    const { data } = await supabase.from('pricing_packages').select('*').order('sort_order');
    if (data) setPackages(data as any);
  };

  useEffect(() => { fetchPackages(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyPackage, sort_order: packages.length });
    setFeatureInput('');
    setDialogOpen(true);
  };

  const openEdit = (pkg: Package) => {
    setEditing(pkg);
    setForm({ ...pkg });
    setFeatureInput('');
    setDialogOpen(true);
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setForm(f => ({ ...f, features: [...f.features, featureInput.trim()] }));
    setFeatureInput('');
  };

  const removeFeature = (i: number) => {
    setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error(isAr ? 'العنوان مطلوب' : 'Title is required');
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('pricing_packages').update({
        ...form, updated_at: new Date().toISOString(),
      }).eq('id', editing.id);
      if (error) toast.error(error.message);
      else toast.success(isAr ? 'تم التحديث' : 'Package updated');
    } else {
      const { error } = await supabase.from('pricing_packages').insert(form as any);
      if (error) toast.error(error.message);
      else toast.success(isAr ? 'تم الإنشاء' : 'Package created');
    }
    setSaving(false);
    setDialogOpen(false);
    fetchPackages();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('pricing_packages').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success(isAr ? 'تم الحذف' : 'Package deleted');
      fetchPackages();
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('pricing_packages').update({ is_active: !current }).eq('id', id);
    fetchPackages();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{isAr ? 'باقات الأسعار' : 'Pricing Packages'}</CardTitle>
              <CardDescription>{isAr ? 'إدارة باقات الاشتراك المعروضة على صفحة الهبوط' : 'Manage subscription packages displayed on the landing page'}</CardDescription>
            </div>
            <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 me-1" />{isAr ? 'إضافة باقة' : 'Add Package'}</Button>
          </div>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isAr ? 'لا توجد باقات بعد' : 'No packages yet. Click "Add Package" to create one.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? 'الباقة' : 'Package'}</TableHead>
                    <TableHead>{isAr ? 'السعر' : 'Price'}</TableHead>
                    <TableHead>{isAr ? 'الدورة' : 'Cycle'}</TableHead>
                    <TableHead>{isAr ? 'الحدود' : 'Limits'}</TableHead>
                    <TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map(pkg => (
                    <TableRow key={pkg.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {pkg.is_featured && <Star className="h-4 w-4 text-primary fill-primary" />}
                          <div>
                            <div className="font-medium text-foreground">{pkg.title}</div>
                            <div className="text-xs text-muted-foreground">{pkg.subtitle}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-foreground font-medium">${pkg.regular_price}</div>
                        {pkg.sale_price != null && <div className="text-xs text-primary">${pkg.sale_price} sale</div>}
                      </TableCell>
                      <TableCell><Badge variant="secondary">{pkg.billing_cycle}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {pkg.max_teachers}T / {pkg.max_students}S / {pkg.max_courses}C
                      </TableCell>
                      <TableCell>
                        <Switch checked={pkg.is_active} onCheckedChange={() => toggleActive(pkg.id, pkg.is_active)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <ActionButton icon={Edit2} label={isAr ? 'تعديل' : 'Edit'} onClick={() => openEdit(pkg)} />
                          <ActionButton icon={Trash2} label={isAr ? 'حذف' : 'Delete'} destructive onClick={() => handleDelete(pkg.id)} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? (isAr ? 'تعديل الباقة' : 'Edit Package') : (isAr ? 'إضافة باقة' : 'Add Package')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Title (EN)</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><Label>Title (AR)</Label><Input dir="rtl" value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Subtitle (EN)</Label><Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} /></div>
              <div><Label>Subtitle (AR)</Label><Input dir="rtl" value={form.subtitle_ar} onChange={e => setForm(f => ({ ...f, subtitle_ar: e.target.value }))} /></div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div><Label>{isAr ? 'السعر العادي' : 'Regular Price'}</Label><Input type="number" value={form.regular_price} onChange={e => setForm(f => ({ ...f, regular_price: Number(e.target.value) }))} /></div>
              <div><Label>{isAr ? 'سعر التخفيض' : 'Sale Price'}</Label><Input type="number" value={form.sale_price ?? ''} onChange={e => setForm(f => ({ ...f, sale_price: e.target.value ? Number(e.target.value) : null }))} placeholder="Optional" /></div>
              <div>
                <Label>{isAr ? 'دورة الفوترة' : 'Billing Cycle'}</Label>
                <Select value={form.billing_cycle} onValueChange={v => setForm(f => ({ ...f, billing_cycle: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{isAr ? 'شهري' : 'Monthly'}</SelectItem>
                    <SelectItem value="yearly">{isAr ? 'سنوي' : 'Yearly'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>{isAr ? 'معلمين' : 'Max Teachers'}</Label><Input type="number" value={form.max_teachers} onChange={e => setForm(f => ({ ...f, max_teachers: Number(e.target.value) }))} /></div>
              <div><Label>{isAr ? 'طلاب' : 'Max Students'}</Label><Input type="number" value={form.max_students} onChange={e => setForm(f => ({ ...f, max_students: Number(e.target.value) }))} /></div>
              <div><Label>{isAr ? 'دورات' : 'Max Courses'}</Label><Input type="number" value={form.max_courses} onChange={e => setForm(f => ({ ...f, max_courses: Number(e.target.value) }))} /></div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_featured} onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))} />
                <Label>{isAr ? 'باقة مميزة' : 'Featured'}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>{isAr ? 'نشط' : 'Active'}</Label>
              </div>
              <div>
                <Label>{isAr ? 'الترتيب' : 'Sort Order'}</Label>
                <Input type="number" className="w-20" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">{isAr ? 'الميزات' : 'Features'}</Label>
              <div className="flex gap-2 mb-2">
                <Input value={featureInput} onChange={e => setFeatureInput(e.target.value)} placeholder={isAr ? 'أضف ميزة...' : 'Add a feature...'} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())} />
                <Button variant="outline" size="sm" onClick={addFeature} type="button"><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-1">
                {form.features.map((f, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2 rounded bg-muted/50 text-sm">
                    <span className="text-foreground">{f}</span>
                    <ActionButton icon={Trash2} label={isAr ? 'حذف' : 'Remove'} destructive onClick={() => removeFeature(i)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? '...' : (editing ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'إنشاء' : 'Create'))}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SaaSPricingSettings;
