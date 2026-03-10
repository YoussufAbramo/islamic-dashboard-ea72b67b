import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Copy, ExternalLink, FileText, CreditCard, CheckCircle, Clock, Stamp } from 'lucide-react';
import { format } from 'date-fns';
import { GATEWAYS } from '@/components/settings/PaymentGatewayCard';

const statusConfig: Record<string, { bg: string; label: string; labelAr: string }> = {
  pending: { bg: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', label: 'Pending', labelAr: 'قيد الانتظار' },
  paid: { bg: 'bg-green-500/10 text-green-600 border-green-500/30', label: 'Paid', labelAr: 'مدفوع' },
  overdue: { bg: 'bg-red-500/10 text-red-600 border-red-500/30', label: 'Overdue', labelAr: 'متأخرة' },
  cancelled: { bg: 'bg-muted text-muted-foreground border-border', label: 'Cancelled', labelAr: 'ملغية' },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any;
  isAr: boolean;
  formatPrice: (n: number) => string;
  paymentGateway: string;
  appLogo: string;
  appName: string;
  onCopyUrl: (inv: any) => void;
  role: string | null;
  signatureImage?: string;
  stampImage?: string;
}

const InvoicePreviewDialog = ({ open, onOpenChange, invoice, isAr, formatPrice, paymentGateway, appLogo, appName, onCopyUrl, role, signatureImage, stampImage }: Props) => {
  if (!invoice) return null;

  const sc = statusConfig[invoice.status] || statusConfig.pending;
  const gateway = GATEWAYS.find(g => g.id === paymentGateway);

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const inv = invoice;
    const gwName = gateway?.name || 'N/A';
    w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${inv.invoice_number}</title>
      <style>body{font-family:system-ui;max-width:700px;margin:40px auto;padding:20px;color:#333}
      .header{display:flex;justify-content:space-between;border-bottom:2px solid #333;padding-bottom:20px;margin-bottom:20px}
      .amount{text-align:center;font-size:2em;font-weight:bold;padding:20px;background:#f5f5f5;border-radius:8px;margin:20px 0}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:20px 0}
      .card{border:1px solid #ddd;padding:16px;border-radius:8px}
      .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
      .pending{background:#fef3c7;color:#92400e}.paid{background:#d1fae5;color:#065f46}
      .logo{max-height:40px;margin-bottom:8px}
      .footer{margin-top:40px;padding-top:20px;border-top:1px solid #ddd;text-align:center;color:#999;font-size:12px}
      @media print{body{margin:0}}</style></head>
      <body>
      ${appLogo ? `<img src="${appLogo}" class="logo" alt="logo" />` : ''}
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
      <div class="footer"><p>${appName}</p></div>
      </body></html>`);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isAr ? 'معاينة الفاتورة' : 'Invoice Preview'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Logo + Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {appLogo && (
                <img src={appLogo} alt="Logo" className="h-10 w-10 rounded-md object-contain" />
              )}
              <div>
                <h3 className="text-lg font-bold">{invoice.invoice_number}</h3>
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'تاريخ الإنشاء' : 'Created'}: {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={sc.bg}>
              {isAr ? sc.labelAr : sc.label}
            </Badge>
          </div>

          <Separator />

          {/* Student & Course Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">{isAr ? 'معلومات الطالب' : 'Student Info'}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-1">
                <p className="font-medium">{invoice.students?.profiles?.full_name || '-'}</p>
                <p className="text-sm text-muted-foreground">{invoice.students?.profiles?.email || '-'}</p>
                <p className="text-sm text-muted-foreground">{invoice.students?.profiles?.phone || '-'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">{isAr ? 'تفاصيل الدورة' : 'Course Details'}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-1">
                <p className="font-medium">{isAr ? (invoice.courses?.title_ar || invoice.courses?.title) : invoice.courses?.title || '-'}</p>
                <p className="text-sm text-muted-foreground">
                  {invoice.billing_cycle === 'yearly' ? (isAr ? 'اشتراك سنوي' : 'Yearly subscription') : (isAr ? 'اشتراك شهري' : 'Monthly subscription')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Amount Block */}
          <div className="p-6 rounded-xl border border-border bg-muted/30 text-center">
            <p className="text-sm text-muted-foreground">{isAr ? 'المبلغ المستحق' : 'Amount Due'}</p>
            <p className="text-4xl font-bold mt-1">{formatPrice(invoice.amount)}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {isAr ? 'تاريخ الاستحقاق' : 'Due'}: {invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : '-'}
            </p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {isAr ? 'طرق الدفع المتاحة' : 'Available Payment Methods'}
            </h4>
            {gateway ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                <span className="text-sm font-bold" style={{ color: gateway.color }}>{gateway.name[0]}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium">{gateway.name}</span>
                </div>
                <Badge className="text-[10px]">{isAr ? 'مفعّل' : 'Active'}</Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isAr ? 'لا توجد بوابة دفع مفعلة. فعّل واحدة من إعدادات التطبيق.' : 'No payment gateway configured. Enable one in App Settings.'}
              </p>
            )}

            {/* Pay Now Button */}
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && gateway && (
              <Button
                className="w-full"
                size="lg"
                variant={role === 'admin' ? 'secondary' : 'default'}
                onClick={() => {
                  // Placeholder: open gateway payment page
                  window.open(`#pay/${invoice.id}`, '_blank');
                }}
              >
                <CreditCard className="h-4 w-4 me-2" />
                {isAr ? 'ادفع الآن' : 'Pay Now'}
              </Button>
            )}
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">{isAr ? 'النشاط' : 'Activity'}</h4>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-3 w-3 text-primary" />
                </div>
                <span className="text-muted-foreground">
                  {isAr ? 'تم الإنشاء' : 'Created'} — {format(new Date(invoice.created_at), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
              {invoice.paid_at && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  </div>
                  <span className="text-muted-foreground">
                    {isAr ? 'تم الدفع' : 'Paid'} — {format(new Date(invoice.paid_at), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="space-y-1">
              <h4 className="font-medium text-sm">{isAr ? 'ملاحظات' : 'Notes'}</h4>
              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">{invoice.notes}</p>
            </div>
          )}

        {/* Signature & Stamp */}
          {(signatureImage || stampImage) && (
            <div className="pt-4 border-t border-border">
              <h4 className="font-medium text-sm mb-3">{isAr ? 'التوقيع والختم' : 'Signature & Stamp'}</h4>
              <div className="flex items-end justify-between gap-4">
                {signatureImage && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{isAr ? 'التوقيع' : 'Signature'}</p>
                    <img src={signatureImage} alt="Signature" className="h-16 w-auto object-contain" />
                  </div>
                )}
                {stampImage && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{isAr ? 'الختم' : 'Stamp'}</p>
                    <img src={stampImage} alt="Stamp" className="h-16 w-auto object-contain" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Brand Footer */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Stamp className="h-4 w-4" />
              <span className="text-xs">{appName}</span>
            </div>
            {appLogo && (
              <img src={appLogo} alt="Brand" className="h-8 opacity-50 grayscale" />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => onCopyUrl(invoice)}>
              <Copy className="h-4 w-4 me-1" />
              {isAr ? 'نسخ الرابط' : 'Copy URL'}
            </Button>
            <Button size="sm" onClick={handlePrint}>
              <ExternalLink className="h-4 w-4 me-1" />
              {isAr ? 'طباعة الفاتورة' : 'Print Invoice'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoicePreviewDialog;
