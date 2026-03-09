import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Eye, ExternalLink, FileText, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { GATEWAYS } from '@/components/settings/PaymentGatewayCard';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  paid: 'bg-green-500/10 text-green-500 border-green-500/30',
  overdue: 'bg-red-500/10 text-red-500 border-red-500/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

const Invoices = () => {
  const { language } = useLanguage();
  const { role } = useAuth();
  const { currency, currencyDecimals, paymentGateway } = useAppSettings();
  const isAr = language === 'ar';

  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Form data
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({
    subscription_id: '', billing_cycle: 'monthly', notes: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  const formatPrice = (amount: number) => `${currency.symbol}${amount.toFixed(currencyDecimals)}`;

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from('invoices')
      .select('*, courses:course_id(title, title_ar), students:student_id(user_id, profiles:students_user_id_profiles_fkey(full_name, email, phone))')
      .order('created_at', { ascending: false });
    setInvoices(data || []);
  };

  const fetchFormData = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('id, price, subscription_type, courses:course_id(title), students:student_id(id, user_id, profiles:students_user_id_profiles_fkey(full_name))')
      .eq('status', 'active');
    setSubscriptions(data || []);
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handleCreate = async () => {
    if (!createForm.subscription_id) {
      toast.error(isAr ? 'يرجى اختيار اشتراك' : 'Please select a subscription');
      return;
    }
    setCreateLoading(true);

    const sub = subscriptions.find(s => s.id === createForm.subscription_id);
    if (!sub) { setCreateLoading(false); return; }

    const amount = sub.price || 0;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (createForm.billing_cycle === 'yearly' ? 365 : 30));

    const { error } = await supabase.from('invoices').insert({
      subscription_id: sub.id,
      student_id: sub.students?.id,
      course_id: sub.courses ? undefined : undefined,
      amount,
      billing_cycle: createForm.billing_cycle,
      due_date: dueDate.toISOString().split('T')[0],
      notes: createForm.notes,
    });

    setCreateLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isAr ? 'تم إنشاء الفاتورة' : 'Invoice created successfully');
      setCreateOpen(false);
      setCreateForm({ subscription_id: '', billing_cycle: 'monthly', notes: '' });
      fetchInvoices();
    }
  };

  const openPreview = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPreviewOpen(true);
  };

  const getInvoiceUrl = (invoice: any) => {
    return `${window.location.origin}/invoice/${invoice.id}`;
  };

  const copyInvoiceUrl = (invoice: any) => {
    navigator.clipboard.writeText(getInvoiceUrl(invoice));
    toast.success(isAr ? 'تم نسخ الرابط' : 'Invoice URL copied');
  };

  const filtered = invoices.filter((inv) => {
    const studentName = inv.students?.profiles?.full_name || '';
    const invoiceNum = inv.invoice_number || '';
    const q = search.toLowerCase();
    return studentName.toLowerCase().includes(q) || invoiceNum.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isAr ? 'الفواتير' : 'Invoices'}</h1>
        {role === 'admin' && (
          <Button onClick={() => { setCreateOpen(true); fetchFormData(); }}>
            <Plus className="h-4 w-4 me-2" />
            {isAr ? 'فاتورة جديدة' : 'New Invoice'}
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isAr ? 'بحث...' : 'Search...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? 'رقم الفاتورة' : 'Invoice #'}</TableHead>
              <TableHead>{isAr ? 'الطالب' : 'Student'}</TableHead>
              <TableHead>{isAr ? 'الدورة' : 'Course'}</TableHead>
              <TableHead>{isAr ? 'المبلغ' : 'Amount'}</TableHead>
              <TableHead>{isAr ? 'الدورة المالية' : 'Cycle'}</TableHead>
              <TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead>
              <TableHead>{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</TableHead>
              <TableHead>{isAr ? 'إجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                <TableCell>{inv.students?.profiles?.full_name || '-'}</TableCell>
                <TableCell>{isAr ? (inv.courses?.title_ar || inv.courses?.title) : inv.courses?.title || '-'}</TableCell>
                <TableCell className="font-medium">{formatPrice(inv.amount)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {inv.billing_cycle === 'yearly' ? (isAr ? 'سنوي' : 'Yearly') : (isAr ? 'شهري' : 'Monthly')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[inv.status] || ''}>
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{inv.due_date ? format(new Date(inv.due_date), 'MMM dd, yyyy') : '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openPreview(inv)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => copyInvoiceUrl(inv)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  {isAr ? 'لا توجد فواتير' : 'No invoices found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
                onValueChange={(v) => setCreateForm({ ...createForm, subscription_id: v })}
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
              <Input
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                placeholder={isAr ? 'ملاحظات اختيارية' : 'Optional notes'}
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

      {/* Invoice Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {isAr ? 'معاينة الفاتورة' : 'Invoice Preview'}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">{selectedInvoice.invoice_number}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isAr ? 'تاريخ الإنشاء' : 'Created'}: {format(new Date(selectedInvoice.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
                <Badge variant="outline" className={statusColors[selectedInvoice.status] || ''}>
                  {selectedInvoice.status}
                </Badge>
              </div>

              {/* Student & Course Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm">{isAr ? 'معلومات الطالب' : 'Student Info'}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-1">
                    <p className="font-medium">{selectedInvoice.students?.profiles?.full_name || '-'}</p>
                    <p className="text-sm text-muted-foreground">{selectedInvoice.students?.profiles?.email || '-'}</p>
                    <p className="text-sm text-muted-foreground">{selectedInvoice.students?.profiles?.phone || '-'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm">{isAr ? 'تفاصيل الدورة' : 'Course Details'}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-1">
                    <p className="font-medium">{isAr ? (selectedInvoice.courses?.title_ar || selectedInvoice.courses?.title) : selectedInvoice.courses?.title || '-'}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedInvoice.billing_cycle === 'yearly' ? (isAr ? 'اشتراك سنوي' : 'Yearly subscription') : (isAr ? 'اشتراك شهري' : 'Monthly subscription')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Amount */}
              <div className="p-4 rounded-lg border border-border bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground">{isAr ? 'المبلغ المستحق' : 'Amount Due'}</p>
                <p className="text-3xl font-bold mt-1">{formatPrice(selectedInvoice.amount)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isAr ? 'تاريخ الاستحقاق' : 'Due'}: {selectedInvoice.due_date ? format(new Date(selectedInvoice.due_date), 'MMM dd, yyyy') : '-'}
                </p>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">{isAr ? 'طرق الدفع المتاحة' : 'Available Payment Methods'}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {paymentGateway ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/30 bg-primary/5">
                      <span className="text-lg">{GATEWAYS.find(g => g.id === paymentGateway)?.icon || '💳'}</span>
                      <span className="text-sm font-medium">{GATEWAYS.find(g => g.id === paymentGateway)?.name || paymentGateway}</span>
                      <Badge className="ms-auto text-[10px]">{isAr ? 'مفعّل' : 'Active'}</Badge>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground col-span-full">
                      {isAr ? 'لا توجد بوابة دفع مفعلة. فعّل واحدة من إعدادات التطبيق.' : 'No payment gateway configured. Enable one in App Settings.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">{isAr ? 'ملاحظات' : 'Notes'}</h4>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => copyInvoiceUrl(selectedInvoice)}>
                  <Copy className="h-4 w-4 me-1" />
                  {isAr ? 'نسخ الرابط' : 'Copy URL'}
                </Button>
                <Button size="sm" onClick={() => {
                  const w = window.open('', '_blank');
                  if (!w) return;
                  const inv = selectedInvoice;
                  const gwName = GATEWAYS.find(g => g.id === paymentGateway)?.name || 'N/A';
                  w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${inv.invoice_number}</title>
                    <style>body{font-family:system-ui;max-width:700px;margin:40px auto;padding:20px;color:#333}
                    .header{display:flex;justify-content:space-between;border-bottom:2px solid #333;padding-bottom:20px;margin-bottom:20px}
                    .amount{text-align:center;font-size:2em;font-weight:bold;padding:20px;background:#f5f5f5;border-radius:8px;margin:20px 0}
                    .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:20px 0}
                    .card{border:1px solid #ddd;padding:16px;border-radius:8px}
                    .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
                    .pending{background:#fef3c7;color:#92400e}.paid{background:#d1fae5;color:#065f46}
                    @media print{body{margin:0}}</style></head>
                    <body>
                    <div class="header"><div><h1 style="margin:0">${inv.invoice_number}</h1>
                    <p style="color:#666">Created: ${format(new Date(inv.created_at), 'MMM dd, yyyy')}</p></div>
                    <span class="badge ${inv.status}">${inv.status.toUpperCase()}</span></div>
                    <div class="grid"><div class="card"><h3>Student</h3><p><strong>${inv.students?.profiles?.full_name || '-'}</strong></p>
                    <p>${inv.students?.profiles?.email || '-'}</p><p>${inv.students?.profiles?.phone || '-'}</p></div>
                    <div class="card"><h3>Course</h3><p><strong>${inv.courses?.title || '-'}</strong></p>
                    <p>${inv.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'} subscription</p></div></div>
                    <div class="amount">${formatPrice(inv.amount)}</div>
                    <p style="text-align:center;color:#666">Due: ${inv.due_date ? format(new Date(inv.due_date), 'MMM dd, yyyy') : '-'}</p>
                    <div class="card" style="margin-top:20px"><h3>Payment Method</h3><p>${gwName}</p></div>
                    ${inv.notes ? `<div class="card" style="margin-top:12px"><h3>Notes</h3><p>${inv.notes}</p></div>` : ''}
                    </body></html>`);
                  w.document.close();
                }}>
                  <ExternalLink className="h-4 w-4 me-1" />
                  {isAr ? 'فتح الفاتورة' : 'Open Invoice'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
