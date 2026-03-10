import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { FileText, CreditCard, Printer, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import type { FooterPosition } from '@/contexts/AppSettingsContext';

const statusConfig: Record<string, { bg: string; label: string }> = {
  pending: { bg: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', label: 'Pending' },
  paid: { bg: 'bg-green-500/10 text-green-600 border-green-500/30', label: 'Paid' },
  overdue: { bg: 'bg-red-500/10 text-red-600 border-red-500/30', label: 'Overdue' },
  cancelled: { bg: 'bg-muted text-muted-foreground border-border', label: 'Cancelled' },
};

const InvoiceView = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const signatureImage = typeof window !== 'undefined' ? localStorage.getItem('app_signature_image') || '' : '';
  const stampImage = typeof window !== 'undefined' ? localStorage.getItem('app_stamp_image') || '' : '';
  const signaturePosition = (typeof window !== 'undefined' ? localStorage.getItem('app_signature_position') : 'left') as FooterPosition || 'left';
  const stampPosition = (typeof window !== 'undefined' ? localStorage.getItem('app_stamp_position') : 'right') as FooterPosition || 'right';

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) { setError(true); setLoading(false); return; }
      const { data, error: err } = await supabase
        .from('invoices')
        .select('*, courses:invoices_course_id_fkey(title, title_ar), students:invoices_student_id_fkey(user_id, profiles:students_user_id_profiles_fkey(full_name, email, phone))')
        .eq('id', id)
        .maybeSingle();

      if (err || !data) { setError(true); } else { setInvoice(data); }
      setLoading(false);
    };
    fetchInvoice();
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-bold">Invoice Not Found</h2>
            <p className="text-muted-foreground">This invoice does not exist or has been removed.</p>
            <Link to="/">
              <Button variant="outline"><ArrowLeft className="h-4 w-4 me-2" />Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sc = statusConfig[invoice.status] || statusConfig.pending;
  const formatAmount = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-background py-8 px-4 print:py-2 print:px-0">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Print-hidden nav */}
        <div className="flex justify-between items-center print:hidden">
          <Link to="/">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 me-2" />Home</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 me-2" />Print
          </Button>
        </div>

        {/* Invoice Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              {invoice.invoice_number}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Created: {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
            </p>
          </div>
          <Badge variant="outline" className={sc.bg}>{sc.label}</Badge>
        </div>

        <Separator />

        {/* Student & Course */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Student Info</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-1">
              <p className="font-medium">{invoice.students?.profiles?.full_name || '-'}</p>
              <p className="text-sm text-muted-foreground">{invoice.students?.profiles?.email || '-'}</p>
              <p className="text-sm text-muted-foreground">{invoice.students?.profiles?.phone || '-'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Course Details</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-1">
              <p className="font-medium">{invoice.courses?.title || '-'}</p>
              <p className="text-sm text-muted-foreground">
                {invoice.billing_cycle === 'yearly' ? 'Yearly subscription' : 'Monthly subscription'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Amount */}
        <div className="p-6 rounded-xl border border-border bg-muted/30 text-center">
          <p className="text-sm text-muted-foreground">Amount Due</p>
          <p className="text-4xl font-bold mt-1">{formatAmount(invoice.amount)}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Due: {invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : '-'}
          </p>
        </div>

        {/* Pay Now placeholder */}
        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
          <Button className="w-full" size="lg">
            <CreditCard className="h-4 w-4 me-2" />Pay Now
          </Button>
        )}

        {/* Activity */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Activity</h4>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-3 w-3 text-primary" />
              </div>
              <span className="text-muted-foreground">
                Created — {format(new Date(invoice.created_at), 'MMM dd, yyyy HH:mm')}
              </span>
            </div>
            {invoice.paid_at && (
              <div className="flex items-center gap-3 text-sm">
                <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                </div>
                <span className="text-muted-foreground">
                  Paid — {format(new Date(invoice.paid_at), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="space-y-1">
            <h4 className="font-medium text-sm">Notes</h4>
            <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">{invoice.notes}</p>
          </div>
        )}

        {/* Signature & Stamp */}
        {(signatureImage || stampImage) && (
          <div className="pt-4 border-t border-border print:border-border">
            <div className="flex items-end gap-4">
              {signatureImage && (
                <div className={`space-y-1 ${signaturePosition === 'center' ? 'mx-auto' : signaturePosition === 'right' ? 'ms-auto' : ''}`}>
                  <p className="text-xs text-muted-foreground">Signature</p>
                  <img src={signatureImage} alt="Signature" className="h-16 w-auto object-contain" />
                </div>
              )}
              {stampImage && (
                <div className={`space-y-1 ${stampPosition === 'center' ? 'mx-auto' : stampPosition === 'right' ? 'ms-auto' : ''}`}>
                  <p className="text-xs text-muted-foreground">Stamp</p>
                  <img src={stampImage} alt="Stamp" className="h-16 w-auto object-contain" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceView;
