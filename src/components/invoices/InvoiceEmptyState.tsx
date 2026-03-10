import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';

interface Props {
  isAr: boolean;
  isAdmin: boolean;
  onCreateClick: () => void;
}

const InvoiceEmptyState = ({ isAr, isAdmin, onCreateClick }: Props) => (
  <div className="flex flex-col items-center justify-center py-20 space-y-4">
    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
      <FileText className="h-8 w-8 text-muted-foreground" />
    </div>
    <div className="text-center space-y-1">
      <h3 className="text-lg font-semibold">{isAr ? 'لا توجد فواتير بعد' : 'No invoices yet'}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {isAr
          ? 'أنشئ أول فاتورة لبدء تتبع المدفوعات والإيرادات.'
          : 'Create your first invoice to start tracking payments and revenue.'}
      </p>
    </div>
    {isAdmin && (
      <Button onClick={onCreateClick}>
        <Plus className="h-4 w-4 me-2" />
        {isAr ? 'فاتورة جديدة' : 'New Invoice'}
      </Button>
    )}
  </div>
);

export default InvoiceEmptyState;
