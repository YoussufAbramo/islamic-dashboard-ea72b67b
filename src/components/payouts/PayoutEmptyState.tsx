import EmptyState from '@/components/EmptyState';
import { DollarSign } from 'lucide-react';

interface Props {
  isAr: boolean;
}

const PayoutEmptyState = ({ isAr }: Props) => (
  <EmptyState
    icon={DollarSign}
    title={isAr ? 'لا توجد طلبات صرف بعد' : 'No payout requests yet'}
    description={isAr
      ? 'ستظهر طلبات الصرف هنا عندما يقوم المعلمون بطلب مستحقاتهم.'
      : 'Payout requests will appear here when teachers submit their payment requests.'}
  />
);

export default PayoutEmptyState;
