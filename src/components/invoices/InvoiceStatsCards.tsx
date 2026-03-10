import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  invoices: any[];
  loading: boolean;
  isAr: boolean;
  formatPrice: (n: number) => string;
}

const InvoiceStatsCards = ({ invoices, loading, isAr, formatPrice }: Props) => {
  const totalCount = invoices.length;
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;

  const stats = [
    { label: isAr ? 'إجمالي الفواتير' : 'Total Invoices', value: String(totalCount), icon: FileText, accent: 'text-primary' },
    { label: isAr ? 'المدفوع' : 'Paid', value: formatPrice(paidAmount), icon: CheckCircle, accent: 'text-green-500' },
    { label: isAr ? 'قيد الانتظار' : 'Pending', value: formatPrice(pendingAmount), icon: Clock, accent: 'text-yellow-500' },
    { label: isAr ? 'متأخرة' : 'Overdue', value: String(overdueCount), icon: AlertTriangle, accent: 'text-red-500' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <Card key={i} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${s.accent}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InvoiceStatsCards;
