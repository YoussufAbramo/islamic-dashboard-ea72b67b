import EmptyState from '@/components/EmptyState';
import { FileText } from 'lucide-react';

interface Props {
  isAr: boolean;
  isAdmin: boolean;
  onCreateClick: () => void;
}

const InvoiceEmptyState = ({ isAr, isAdmin, onCreateClick }: Props) => (
  <EmptyState
    icon={FileText}
    title={isAr ? 'لا توجد فواتير بعد' : 'No invoices yet'}
    description={isAr
      ? 'أنشئ أول فاتورة لبدء تتبع المدفوعات والإيرادات.'
      : 'Create your first invoice to start tracking payments and revenue.'}
    actionLabel={isAdmin ? (isAr ? 'فاتورة جديدة' : 'New Invoice') : undefined}
    onAction={isAdmin ? onCreateClick : undefined}
  />
);

export default InvoiceEmptyState;
