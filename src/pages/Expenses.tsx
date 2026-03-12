import { useState, useEffect, useMemo } from 'react';
import { usePagination } from '@/hooks/use-pagination';
import PaginationControls from '@/components/PaginationControls';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Search, Plus, Receipt, ArrowUp, ArrowDown, Trash2, Pencil, DollarSign, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { TableSkeleton } from '@/components/PageSkeleton';
import EmptyState from '@/components/EmptyState';
import { ACTION_BTN, ACTION_BTN_DESTRUCTIVE, ACTION_ICON } from '@/lib/actionBtnClass';
import { format } from 'date-fns';

interface Expense {
  id: string;
  title: string;
  title_ar: string | null;
  amount: number;
  category_id: string | null;
  expense_date: string;
  notes: string | null;
  status: string;
  created_at: string;
  category?: { title: string; title_ar: string | null; color: string } | null;
}

interface ExpenseCategory {
  id: string;
  title: string;
  title_ar: string | null;
  color: string;
}

const Expenses = () => {
  const { language } = useLanguage();
  const { role, user } = useAuth();
  const { currency, currencyDecimals } = useAppSettings();
  const isAr = language === 'ar';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '', title_ar: '', amount: '', category_id: '', expense_date: new Date().toISOString().split('T')[0], notes: '', status: 'pending',
  });

  const formatPrice = (amount: number) => `${currency.symbol}${amount.toFixed(currencyDecimals)}`;

  const fetchExpenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('expenses' as any)
      .select('*, category:category_id(title, title_ar, color)')
      .order('created_at', { ascending: false });
    if (error) notifyError({ error, isAr, rawMessage: error.message });
    setExpenses((data as any[]) || []);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('expense_categories' as any)
      .select('id, title, title_ar, color')
      .eq('is_active', true)
      .order('sort_order');
    setCategories((data as any[]) || []);
  };

  useEffect(() => { fetchExpenses(); fetchCategories(); }, []);

  const resetForm = () => setForm({ title: '', title_ar: '', amount: '', category_id: '', expense_date: new Date().toISOString().split('T')[0], notes: '', status: 'pending' });

  const handleCreate = async () => {
    if (!form.title.trim() || !form.amount) {
      toast.error(isAr ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('expenses' as any).insert({
      title: form.title,
      title_ar: form.title_ar || null,
      amount: parseFloat(form.amount),
      category_id: form.category_id || null,
      expense_date: form.expense_date,
      notes: form.notes,
      status: form.status,
      created_by: user?.id || null,
    } as any);
    setSaving(false);
    if (error) { notifyError({ error, isAr, rawMessage: error.message }); return; }
    toast.success(isAr ? 'تم إنشاء المصروف' : 'Expense created');
    setCreateOpen(false);
    resetForm();
    fetchExpenses();
  };

  const openEdit = (exp: Expense) => {
    setEditItem(exp);
    setForm({
      title: exp.title,
      title_ar: exp.title_ar || '',
      amount: exp.amount.toString(),
      category_id: exp.category_id || '',
      expense_date: exp.expense_date,
      notes: exp.notes || '',
      status: exp.status,
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    setSaving(true);
    const { error } = await supabase.from('expenses' as any).update({
      title: form.title,
      title_ar: form.title_ar || null,
      amount: parseFloat(form.amount),
      category_id: form.category_id || null,
      expense_date: form.expense_date,
      notes: form.notes,
      status: form.status,
      updated_at: new Date().toISOString(),
    } as any).eq('id', editItem.id);
    setSaving(false);
    if (error) { notifyError({ error, isAr, rawMessage: error.message }); return; }
    toast.success(isAr ? 'تم التحديث' : 'Updated successfully');
    setEditOpen(false);
    fetchExpenses();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('expenses' as any).delete().eq('id', deleteTarget);
    toast.success(isAr ? 'تم الحذف' : 'Deleted');
    setDeleteTarget(null);
    fetchExpenses();
  };

  const statusCounts = {
    all: expenses.length,
    pending: expenses.filter(e => e.status === 'pending').length,
    approved: expenses.filter(e => e.status === 'approved').length,
    paid: expenses.filter(e => e.status === 'paid').length,
  };

  const totalAmount = expenses.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0);
  const pendingAmount = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);

  const filtered = useMemo(() => {
    let result = expenses.filter(exp => {
      const matchesStatus = statusFilter === 'all' || exp.status === statusFilter;
      const q = search.toLowerCase();
      const matchesSearch = exp.title.toLowerCase().includes(q) || (exp.title_ar || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
    result.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return result;
  }, [expenses, statusFilter, search, sortOrder]);

  const statusTabs = [
    { value: 'all', label: isAr ? 'الكل' : 'All' },
    { value: 'pending', label: isAr ? 'قيد الانتظار' : 'Pending' },
    { value: 'approved', label: isAr ? 'معتمد' : 'Approved' },
    { value: 'paid', label: isAr ? 'مدفوع' : 'Paid' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">{isAr ? 'مدفوع' : 'Paid'}</Badge>;
      case 'approved': return <Badge className="bg-primary/10 text-primary border-primary/30">{isAr ? 'معتمد' : 'Approved'}</Badge>;
      default: return <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">{isAr ? 'قيد الانتظار' : 'Pending'}</Badge>;
    }
  };

  const { currentPage, totalPages, paginatedItems, setCurrentPage, totalItems, startIndex, endIndex } = usePagination(filtered);

  if (loading) return <TableSkeleton />;

  const renderForm = () => (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div><Label>Title (EN) *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Title (AR)</Label><Input dir="rtl" value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} /></div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>{isAr ? 'المبلغ' : 'Amount'} *</Label>
          <Input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
        </div>
        <div>
          <Label>{isAr ? 'التاريخ' : 'Date'}</Label>
          <Input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>{isAr ? 'التصنيف' : 'Category'}</Label>
          <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
            <SelectTrigger><SelectValue placeholder={isAr ? 'اختر تصنيف' : 'Select category'} /></SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    {isAr ? c.title_ar || c.title : c.title}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{isAr ? 'الحالة' : 'Status'}</Label>
          <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">{isAr ? 'قيد الانتظار' : 'Pending'}</SelectItem>
              <SelectItem value="approved">{isAr ? 'معتمد' : 'Approved'}</SelectItem>
              <SelectItem value="paid">{isAr ? 'مدفوع' : 'Paid'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>{isAr ? 'ملاحظات' : 'Notes'}</Label>
        <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold shrink-0">{isAr ? 'المصروفات' : 'Expenses'}</h1>
        <div className="flex items-center gap-2 ms-auto">
          <Button variant="outline" size="sm" onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className="gap-1 h-9">
            {sortOrder === 'newest' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
            {sortOrder === 'newest' ? (isAr ? 'الأحدث' : 'Newest') : (isAr ? 'الأقدم' : 'Oldest')}
          </Button>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 w-48 sm:w-64" />
          </div>
          <Button onClick={() => { setCreateOpen(true); resetForm(); }}>
            <Plus className="h-4 w-4 me-2" />
            {isAr ? 'مصروف جديد' : 'New Expense'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{expenses.length}</p>
              <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي المصروفات' : 'Total Expenses'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatPrice(totalAmount)}</p>
              <p className="text-xs text-muted-foreground">{isAr ? 'المدفوع' : 'Paid'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatPrice(pendingAmount)}</p>
              <p className="text-xs text-muted-foreground">{isAr ? 'قيد الانتظار' : 'Pending'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={isAr ? 'لا توجد مصروفات' : 'No Expenses'}
          description={isAr ? 'ابدأ بإضافة مصروفاتك' : 'Start by adding your expenses'}
        />
      ) : (
        <>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              {statusTabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-1.5">
                  {tab.label}
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-[18px]">
                    {statusCounts[tab.value as keyof typeof statusCounts] || 0}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? 'العنوان' : 'Title'}</TableHead>
                    <TableHead>{isAr ? 'المبلغ' : 'Amount'}</TableHead>
                    <TableHead>{isAr ? 'التصنيف' : 'Category'}</TableHead>
                    <TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead className="text-center">{isAr ? 'إجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((exp: Expense) => (
                    <TableRow key={exp.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{isAr ? exp.title_ar || exp.title : exp.title}</p>
                        {exp.notes && <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{exp.notes}</p>}
                      </TableCell>
                      <TableCell className="font-semibold">{formatPrice(exp.amount)}</TableCell>
                      <TableCell>
                        {exp.category ? (
                          <Badge variant="outline" className="gap-1">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: exp.category.color }} />
                            {isAr ? exp.category.title_ar || exp.category.title : exp.category.title}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{format(new Date(exp.expense_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{getStatusBadge(exp.status)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className={ACTION_BTN} onClick={() => openEdit(exp)}>
                            <Pencil className={ACTION_ICON} />
                          </Button>
                          <Button variant="ghost" size="icon" className={ACTION_BTN_DESTRUCTIVE} onClick={() => setDeleteTarget(exp.id)}>
                            <Trash2 className={ACTION_ICON} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{isAr ? 'مصروف جديد' : 'New Expense'}</DialogTitle></DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleCreate} disabled={saving}>
              <Receipt className="h-4 w-4 me-2" />
              {saving ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{isAr ? 'تعديل المصروف' : 'Edit Expense'}</DialogTitle></DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleEditSave} disabled={saving}>
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
            <AlertDialogDescription>{isAr ? 'هل أنت متأكد من حذف هذا المصروف؟' : 'Are you sure you want to delete this expense?'}</AlertDialogDescription>
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

export default Expenses;
