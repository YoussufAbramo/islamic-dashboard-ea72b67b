import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { FileText, CreditCard, Printer, ArrowLeft, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import type { FooterPosition } from '@/contexts/AppSettingsContext';
import { useLanguage } from '@/contexts/LanguageContext';

const statusConfig: Record<string, { bg: string; label: string }> = {
  pending: { bg: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', label: 'Pending' },
  paid: { bg: 'bg-green-500/10 text-green-600 border-green-500/30', label: 'Paid' },
  overdue: { bg: 'bg-red-500/10 text-red-600 border-red-500/30', label: 'Overdue' },
  cancelled: { bg: 'bg-muted text-muted-foreground border-border', label: 'Cancelled' },
};

interface GatewayInfo { id: string; name: string; logo: string; color: string; }

const GATEWAYS: GatewayInfo[] = [
  { id: 'paypal', name: 'PayPal', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/200px-PayPal.svg.png', color: 'hsl(210 80% 50%)' },
  { id: 'stripe', name: 'Stripe', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/200px-Stripe_Logo%2C_revised_2016.svg.png', color: 'hsl(260 60% 55%)' },
  { id: 'fawaterak', name: 'Fawaterak', logo: 'https://fawaterak.com/wp-content/uploads/2023/01/fawaterak-logo.png', color: 'hsl(160 50% 40%)' },
  { id: 'xpay', name: 'Xpay', logo: 'https://xpay.app/wp-content/uploads/2022/07/xpay-logo.png', color: 'hsl(30 80% 50%)' },
  { id: 'paymob', name: 'Paymob', logo: 'https://paymob.com/images/paymobLogo.png', color: 'hsl(200 70% 45%)' },
];

const getCurrencySymbol = (): string => {
  try { const raw = localStorage.getItem('app_currency'); if (raw) return JSON.parse(raw).symbol || '$'; } catch {} return '$';
};
const getActiveGateways = (): string[] => {
  try { const raw = localStorage.getItem('app_active_gateways'); if (raw) { const parsed = JSON.parse(raw); return Object.keys(parsed).filter(k => parsed[k]); } } catch {} return [];
};

const InvoiceView = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [invoice, setInvoice] = useState<any>(null);
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [courseInfo, setCourseInfo] = useState<any>(null);

  const currencySymbol = getCurrencySymbol();
  const appName = localStorage.getItem('app_name') || 'Islamic Dashboard';
  const appLogo = localStorage.getItem('app_logo') || '';
  const signatureImage = localStorage.getItem('app_signature_image') || '';
  const stampImage = localStorage.getItem('app_stamp_image') || '';
  const signaturePosition = (localStorage.getItem('app_signature_position') || 'left') as FooterPosition;
  const stampPosition = (localStorage.getItem('app_stamp_position') || 'right') as FooterPosition;
  const activeGatewayIds = getActiveGateways();
  const activeGateways = GATEWAYS.filter(g => activeGatewayIds.includes(g.id));

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) { setError(true); setLoading(false); return; }
      const { data } = await supabase
        .from('invoices')
        .select('*, courses:invoices_course_id_fkey(title, title_ar), students:invoices_student_id_fkey(user_id, profiles:students_user_id_profiles_fkey(full_name, email, phone))')
        .eq('id', id).maybeSingle();
      if (data) {
        setInvoice(data); setStudentInfo(data.students?.profiles); setCourseInfo(data.courses);
      } else if (token) {
        const { data: rpcData } = await supabase.rpc('get_invoice_by_share_token', { _token: token });
        if (rpcData && rpcData.length > 0) setInvoice(rpcData[0]); else setError(true);
      } else setError(true);
      setLoading(false);
    };
    fetchInvoice();
  }, [id, token]);

  const handlePrint = () => window.print();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading invoice...</div></div>;
  if (error || !invoice) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="max-w-md w-full mx-4"><CardContent className="pt-6 text-center space-y-4">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-bold">Invoice Not Found</h2>
        <p className="text-muted-foreground">This invoice does not exist or has been removed.</p>
        <Link to="/"><Button variant="outline"><ArrowLeft className="h-4 w-4 me-2" />Go Home</Button></Link>
      </CardContent></Card>
    </div>
  );

  const sc = statusConfig[invoice.status] || statusConfig.pending;
  const formatAmount = (n: number) => `${currencySymbol}${n.toFixed(2)}`;
  const student = studentInfo || invoice.students?.profiles;
  const course = courseInfo || invoice.courses;
  const originalPrice = invoice.original_price != null ? Number(invoice.original_price) : null;
  const salePrice = invoice.sale_price != null ? Number(invoice.sale_price) : null;
  const hasDiscount = originalPrice != null && salePrice != null && salePrice < originalPrice;

  return (
    <div className="min-h-screen bg-background py-8 px-4 print:py-2 print:px-0">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 me-2" />Home</Button></Link>
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 me-2" />Print</Button>
        </div>

        {/* App Branding - Logo only, full image */}
        <div className="flex justify-center pb-2">
          {appLogo ? (
            <img src={appLogo} alt={appName} className="max-h-20 w-auto object-contain" />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
          )}
        </div>

        <Separator />

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" />{invoice.invoice_number}</h1>
            <p className="text-sm text-muted-foreground mt-1">Created: {format(new Date(invoice.created_at), 'MMM dd, yyyy')}</p>
          </div>
          <Badge variant="outline" className={sc.bg}>{sc.label}</Badge>
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-3 px-4"><CardTitle className="text-sm">Student Info</CardTitle></CardHeader>
            <CardContent className="px-4 pb-3 space-y-1">
              <p className="font-medium">{student?.full_name || '-'}</p>
              <p className="text-sm text-muted-foreground">{student?.email || '-'}</p>
              <p className="text-sm text-muted-foreground">{student?.phone || '-'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3 px-4"><CardTitle className="text-sm">Course Details</CardTitle></CardHeader>
            <CardContent className="px-4 pb-3 space-y-1">
              <p className="font-medium">{course?.title || '-'}</p>
              <p className="text-sm text-muted-foreground">{invoice.billing_cycle === 'yearly' ? 'Yearly subscription' : 'Monthly subscription'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="p-6 rounded-xl border border-border bg-muted/30 text-center">
          {hasDiscount && (
            <p className="text-sm text-muted-foreground line-through mb-1">{isAr ? 'السعر الأصلي:' : 'Original:'} {formatAmount(originalPrice!)}</p>
          )}
          <p className="text-sm text-muted-foreground">{isAr ? 'المبلغ المستحق' : 'Amount Due'}</p>
          <p className="text-4xl font-bold mt-1">{formatAmount(invoice.amount)}</p>
          {hasDiscount && (
            <p className="text-sm text-primary mt-1">{isAr ? 'سعر مخفض' : 'Discounted Price'}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">Due: {invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : '-'}</p>
        </div>

        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
          <div className="space-y-3 print:hidden">
            <h4 className="font-medium text-sm flex items-center gap-2"><CreditCard className="h-4 w-4" />Available Payment Methods</h4>
            {activeGateways.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeGateways.map((gw) => (
                  <button key={gw.id} onClick={() => setSelectedGateway(gw.id)} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-start ${selectedGateway === gw.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-muted/50'}`}>
                    <div className="h-10 w-14 flex items-center justify-center rounded-lg bg-background border border-border overflow-hidden">
                      {logoErrors[gw.id] ? <span className="text-xs font-bold text-muted-foreground">{gw.name}</span> : <img src={gw.logo} alt={gw.name} className="h-8 w-12 object-contain" onError={() => setLogoErrors(prev => ({ ...prev, [gw.id]: true }))} />}
                    </div>
                    <span className="text-sm font-medium">{gw.name}</span>
                    {selectedGateway === gw.id && <Badge className="ms-auto text-[10px]">Selected</Badge>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{isAr ? 'لم يتم تفعيل أي طريقة دفع بعد' : 'No payment methods configured yet.'}</p>
            )}
            <Button className="w-full" size="lg" disabled={!selectedGateway} onClick={() => selectedGateway && window.open(`#pay/${invoice.id}/${selectedGateway}`, '_blank')}>
              <CreditCard className="h-4 w-4 me-2" />
              {selectedGateway ? `Pay Now with ${GATEWAYS.find(g => g.id === selectedGateway)?.name}` : (isAr ? 'اختر طريقة الدفع' : 'Select a payment method')}
            </Button>
          </div>
        )}

        {invoice.notes && (
          <div className="space-y-1"><h4 className="font-medium text-sm">Notes</h4><p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">{invoice.notes}</p></div>
        )}

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

        <div className="pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">{appName}</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
