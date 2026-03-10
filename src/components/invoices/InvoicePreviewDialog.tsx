import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Copy, ExternalLink, FileText, CheckCircle, Clock, Stamp } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig: Record<string, { bg: string; label: string; labelAr: string }> = {
  pending: { bg: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', label: 'Pending', labelAr: 'قيد الانتظار' },
  paid: { bg: 'bg-green-500/10 text-green-600 border-green-500/30', label: 'Paid', labelAr: 'مدفوع' },
  overdue: { bg: 'bg-red-500/10 text-red-600 border-red-500/30', label: 'Overdue', labelAr: 'متأخرة' },
  cancelled: { bg: 'bg-muted text-muted-foreground border-border', label: 'Cancelled', labelAr: 'ملغية' },
};

type FooterPosition = 'left' | 'center' | 'right';

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
  signaturePosition?: FooterPosition;
  stampPosition?: FooterPosition;
}

const InvoicePreviewDialog = ({ open, onOpenChange, invoice, isAr, formatPrice, appLogo, appName, onCopyUrl, signatureImage, stampImage, signaturePosition = 'left', stampPosition = 'right' }: Props) => {
  if (!invoice) return null;

  const sc = statusConfig[invoice.status] || statusConfig.pending;

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
            {invoice.original_amount && invoice.original_amount > invoice.amount ? (
              <div className="mt-1">
                <span className="text-lg text-muted-foreground line-through me-2">{formatPrice(invoice.original_amount)}</span>
                <span className="text-4xl font-bold">{formatPrice(invoice.amount)}</span>
              </div>
            ) : (
              <p className="text-4xl font-bold mt-1">{formatPrice(invoice.amount)}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {isAr ? 'تاريخ الاستحقاق' : 'Due'}: {invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : '-'}
            </p>
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
              <div className="flex items-end gap-4">
                {signatureImage && (
                  <div className={`space-y-1 ${signaturePosition === 'center' ? 'mx-auto' : signaturePosition === 'right' ? 'ms-auto' : ''}`}>
                    <p className="text-xs text-muted-foreground">{isAr ? 'التوقيع' : 'Signature'}</p>
                    <img src={signatureImage} alt="Signature" className="h-16 w-auto object-contain" />
                  </div>
                )}
                {stampImage && (
                  <div className={`space-y-1 ${stampPosition === 'center' ? 'mx-auto' : stampPosition === 'right' ? 'ms-auto' : ''}`}>
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
            <Button size="sm" onClick={() => window.open(`${window.location.origin}/invoice/${invoice.id}`, '_blank')}>
              <ExternalLink className="h-4 w-4 me-1" />
              {isAr ? 'فتح الفاتورة' : 'View Invoice'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoicePreviewDialog;
