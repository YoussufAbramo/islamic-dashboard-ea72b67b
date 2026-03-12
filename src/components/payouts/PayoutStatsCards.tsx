import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  requests: any[];
  loading: boolean;
  isAr: boolean;
}

const PayoutStatsCards = ({ requests, loading, isAr }: Props) => {
  const totalCount = requests.length;
  const pendingAmount = requests.filter(r => r.status === 'under_review').reduce((s, r) => s + Number(r.requested_amount), 0);
  const approvedAmount = requests.filter(r => r.status === 'approved').reduce((s, r) => s + Number(r.requested_amount), 0);
  const declinedCount = requests.filter(r => r.status === 'declined').length;

  const stats = [
    { label: isAr ? 'إجمالي الطلبات' : 'Total Requests', value: String(totalCount), icon: DollarSign, accent: 'text-primary' },
    { label: isAr ? 'قيد المراجعة' : 'Under Review', value: `$${pendingAmount.toFixed(2)}`, icon: Clock, accent: 'text-amber-500' },
    { label: isAr ? 'الموافق عليها' : 'Approved', value: `$${approvedAmount.toFixed(2)}`, icon: CheckCircle, accent: 'text-emerald-500' },
    { label: isAr ? 'المرفوضة' : 'Declined', value: String(declinedCount), icon: XCircle, accent: 'text-red-500' },
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

export default PayoutStatsCards;
