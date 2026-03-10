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
import { Search, Plus, FileText, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import InvoiceStatsCards from '@/components/invoices/InvoiceStatsCards';
import InvoiceTable from '@/components/invoices/InvoiceTable';
import InvoicePreviewDialog from '@/components/invoices/InvoicePreviewDialog';
import InvoiceEmptyState from '@/components/invoices/InvoiceEmptyState';

const Invoices = () => {
  const { language } = useLanguage();
  const { role } = useAuth();
  const { currency, currencyDecimals, paymentGateway, appLogo, appName, signatureImage, stampImage, signaturePosition, stampPosition } = useAppSettings();
  const isAr = language === 'ar';

  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({
    subscription_id: '', billing_cycle: 'monthly', notes: '',
    original_price: '', sale_price: '', course_id: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  const formatPrice = (amount: number) => `${currency.symbol}${amount.toFixed(currencyDecimals)}`;

  const fetchInvoices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('invoices')
      .select('*, courses:invoices_course_id_fkey(title, title_ar), students:invoices_student_id_fkey(user_id, profiles:students_user_id_profiles_fkey(full_name, email, phone))')
      .order('created_at', { ascending: false });
    setInvoices(data || []);
    setLoading(false);
  };

  const fetchFormData = async () => {
    const [subRes, courseRes] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('id, price, subscription_type, courses:course_id(title), students:student_id(id, user_id, profiles:students_user_id_profiles_fkey(full_name))')
        .eq('status', 'active'),
      supabase.from('courses').select('id, title, title_ar').eq('status', 'published'),
    ]);
    setSubscriptions(subRes.data || []);
    setCourses(courseRes.data || []);
  };

  useEffect(() => { fetchInvoices(); }, []);

  // Auto-fill price and billing cycle when subscription is selected
  const handleSubscriptionChange = (subId: string) => {
    const sub = subscriptions.find(s => s.id === subId);
    setCreateForm(prev => ({
      ...prev,
      subscription_id: subId,
      original_price: sub?.price?.toString() || '',
      sale_price: '',
      course_id: '',
      billing_cycle: sub?.subscription_type || 'monthly',
    }));
  };

  const handleCreate = async () => {
    if (!createForm.subscription_id) {
      toast.error(isAr ? 'يرجى اختيار اشتراك' : 'Please select a subscription');
      return;
    }
    setCreateLoading(true);

    const sub = subscriptions.find(s => s.id === createForm.subscription_id);
    if (!sub) { setCreateLoading(false); return; }

    const originalPrice = parseFloat(createForm.original_price) || sub.price || 0;
    const salePrice = createForm.sale_price ? parseFloat(createForm.sale_price) : null;
    const finalAmount = salePrice !== null && salePrice < originalPrice ? salePrice : originalPrice;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (createForm.billing_cycle === 'yearly' ? 365 : 30));

    const insertData: any = {
      subscription_id: sub.id,
      student_id: sub.students?.id,
      amount: finalAmount,
      billing_cycle: createForm.billing_cycle,
      due_date: dueDate.toISOString().split('T')[0],
      notes: createForm.notes,
    };

    if (createForm.course_id) {
      insertData.course_id = createForm.course_id;
    }

    const { error } = await supabase.from('invoices').insert(insertData);

    setCreateLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isAr ? 'تم إنشاء الفاتورة' : 'Invoice created successfully');
      setCreateOpen(false);
      setCreateForm({ subscription_id: '', billing_cycle: 'monthly', notes: '', original_price: '', sale_price: '', course_id: '' });
      fetchInvoices();
    }
  };

  const openPreview = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPreviewOpen(true);
  };

  const copyInvoiceUrl = (invoice: any) => {
    const token = invoice.share_token || '';
    navigator.clipboard.writeText(`${window.location.origin}/invoice/${invoice.id}?token=${token}`);
    toast.success(isAr ? 'تم نسخ الرابط' : 'Invoice URL copied');
  };

  const statusCounts = {
    all: invoices.length,
    pending: invoices.filter(i => i.status === 'pending').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    cancelled: invoices.filter(i => i.status === 'cancelled').length,
  };

  const filtered = useMemo(() => {
    let result = invoices.filter((inv) => {
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      const studentName = inv.students?.profiles?.full_name || '';
      const invoiceNum = inv.invoice_number || '';
      const q = search.toLowerCase();
      const matchesSearch = studentName.toLowerCase().includes(q) || invoiceNum.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
    result.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return result;
  }, [invoices, statusFilter, search, sortOrder]);

  const showEmptyState = !loading && invoices.length === 0;

  const statusTabs = [
    { value: 'all', label: isAr ? 'الكل' : 'All' },
    { value: 'pending', label: isAr ? 'قيد الانتظار' : 'Pending' },
    { value: 'paid', label: isAr ? 'مدفوع' : 'Paid' },
    { value: 'overdue', label: isAr ? 'متأخرة' : 'Overdue' },
    { value: 'cancelled', label: isAr ? 'ملغية' : 'Cancelled' },
  ];

  const { currentPage, totalPages, paginatedItems, setCurrentPage, totalItems, startIndex, endIndex } = usePagination(filtered);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold shrink-0">{isAr ? 'الفواتير' : 'Invoices'}</h1>
        <div className="flex items-center gap-2 ms-auto">
          <Button variant="outline" size="sm" onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className="gap-1">
            {sortOrder === 'newest' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
            {sortOrder === 'newest' ? (isAr ? 'الأحدث' : 'Newest') : (isAr ? 'الأقدم' : 'Oldest')}
          </Button>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isAr ? 'بحث...' : 'Search...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9 w-48 sm:w-64"
            />
          </div>
          {role === 'admin' && (
            <Button onClick={() => { setCreateOpen(true); fetchFormData(); }}>
              <Plus className="h-4 w-4 me-2" />
              {isAr ? 'فاتورة جديدة' : 'New Invoice'}
            </Button>
          )}
        </div>
      </div>

      <InvoiceStatsCards invoices={invoices} loading={loading} isAr={isAr} formatPrice={formatPrice} />

      {showEmptyState ? (
        <InvoiceEmptyState isAr={isAr} isAdmin={role === 'admin'} onCreateClick={() => { setCreateOpen(true); fetchFormData(); }} />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
              <TabsList>
                {statusTabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-1.5">
                    {tab.label}
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-[18px]">
                      {statusCounts[tab.value as keyof typeof statusCounts]}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <InvoiceTable
            invoices={paginatedItems}
            loading={loading}
            isAr={isAr}
            formatPrice={formatPrice}
            onPreview={openPreview}
            onCopyUrl={copyInvoiceUrl}
          />
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />
        </>
      )}

      {/* Create Invoice Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? 'إنشاء فاتورة جديدة' : 'Create New Invoice'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isAr ? 'الاشتراك' : 'Subscription'} *</Label>
              <Select
                value={createForm.subscription_id}
                onValueChange={handleSubscriptionChange}
              >
                <SelectTrigger><SelectValue placeholder={isAr ? 'اختر اشتراك' : 'Select subscription'} /></SelectTrigger>
                <SelectContent>
                  {subscriptions.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.students?.profiles?.full_name || 'Student'} — {sub.courses?.title || 'Course'} ({formatPrice(sub.price || 0)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isAr ? 'الدورة' : 'Course'}</Label>
              <Select
                value={createForm.course_id}
                onValueChange={(v) => setCreateForm({ ...createForm, course_id: v })}
              >
                <SelectTrigger><SelectValue placeholder={isAr ? 'اختر دورة' : 'Select course'} /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {isAr ? (c.title_ar || c.title) : c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{isAr ? 'السعر الأصلي' : 'Original Price'}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.original_price}
                  onChange={(e) => setCreateForm({ ...createForm, original_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'سعر البيع' : 'Sale Price'}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.sale_price}
                  onChange={(e) => setCreateForm({ ...createForm, sale_price: e.target.value })}
                  placeholder={isAr ? 'اختياري' : 'Optional'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{isAr ? 'الدورة المالية' : 'Billing Cycle'}</Label>
              <Select
                value={createForm.billing_cycle}
                onValueChange={(v) => setCreateForm({ ...createForm, billing_cycle: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{isAr ? 'شهري' : 'Monthly'}</SelectItem>
                  <SelectItem value="yearly">{isAr ? 'سنوي' : 'Yearly'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isAr ? 'ملاحظات' : 'Notes'}</Label>
              <Textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                placeholder={isAr ? 'ملاحظات اختيارية' : 'Optional notes'}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleCreate} disabled={createLoading}>
              <FileText className="h-4 w-4 me-2" />
              {createLoading ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء الفاتورة' : 'Generate Invoice')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <InvoicePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        invoice={selectedInvoice}
        isAr={isAr}
        formatPrice={formatPrice}
        paymentGateway={paymentGateway}
        appLogo={appLogo}
        appName={appName}
        onCopyUrl={copyInvoiceUrl}
        role={role}
        signatureImage={signatureImage}
        stampImage={stampImage}
        signaturePosition={signaturePosition}
        stampPosition={stampPosition}
      />
    </div>
  );
};

export default Invoices;
