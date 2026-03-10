import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Copy, ExternalLink, Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig: Record<string, { bg: string; label: string; labelAr: string }> = {
  pending: { bg: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', label: 'Pending', labelAr: 'قيد الانتظار' },
  paid: { bg: 'bg-green-500/10 text-green-600 border-green-500/30', label: 'Paid', labelAr: 'مدفوع' },
  overdue: { bg: 'bg-red-500/10 text-red-600 border-red-500/30', label: 'Overdue', labelAr: 'متأخرة' },
  cancelled: { bg: 'bg-muted text-muted-foreground border-border', label: 'Cancelled', labelAr: 'ملغية' },
};

const amountColor: Record<string, string> = {
  paid: 'text-green-600',
  pending: 'text-yellow-600',
  overdue: 'text-red-600',
};

interface Props {
  invoices: any[];
  loading: boolean;
  isAr: boolean;
  formatPrice: (n: number) => string;
  onPreview: (inv: any) => void;
  onCopyUrl: (inv: any) => void;
  onDelete?: (inv: any) => void;
  onEdit?: (inv: any) => void;
  isAdmin?: boolean;
}

const actionBtnClass = "rounded-full h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted";

const InvoiceTable = ({ invoices, loading, isAr, formatPrice, onPreview, onCopyUrl, onDelete, onEdit, isAdmin }: Props) => {
  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: 8 }).map((_, i) => (
                <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 8 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  const getInvoiceUrl = (inv: any) => {
    const token = inv.share_token || '';
    return `/invoice/${inv.id}?token=${token}`;
  };

  // Mobile card layout
  const mobileCards = (
    <div className="flex flex-col gap-3 md:hidden">
      {invoices.map((inv) => {
        const name = inv.students?.profiles?.full_name || '-';
        const initials = name.charAt(0).toUpperCase();
        const sc = statusConfig[inv.status] || statusConfig.pending;
        return (
          <div key={inv.id} className="rounded-lg border p-4 space-y-3 bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{inv.invoice_number}</p>
                </div>
              </div>
              <Badge variant="outline" className={sc.bg}>{isAr ? sc.labelAr : sc.label}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <p className={`text-lg font-bold ${amountColor[inv.status] || ''}`}>{formatPrice(inv.amount)}</p>
              <p className="text-xs text-muted-foreground">{inv.due_date ? format(new Date(inv.due_date), 'MMM dd, yyyy') : '-'}</p>
            </div>
            <div className="flex gap-2 pt-1 border-t border-border">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => onPreview(inv)}>
                <Eye className="h-4 w-4 me-1" />{isAr ? 'معاينة' : 'Preview'}
              </Button>
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => window.open(getInvoiceUrl(inv), '_blank')}>
                <ExternalLink className="h-4 w-4 me-1" />{isAr ? 'عرض' : 'View'}
              </Button>
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => onCopyUrl(inv)}>
                <Copy className="h-4 w-4 me-1" />{isAr ? 'نسخ' : 'Copy'}
              </Button>
              {isAdmin && onEdit && (
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => onEdit(inv)}>
                  <Pencil className="h-4 w-4 me-1" />{isAr ? 'تعديل' : 'Edit'}
                </Button>
              )}
              {isAdmin && onDelete && (
                <Button variant="ghost" size="sm" className="flex-1 text-destructive hover:text-destructive" onClick={() => onDelete(inv)}>
                  <Trash2 className="h-4 w-4 me-1" />{isAr ? 'حذف' : 'Delete'}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {mobileCards}
      <div className="rounded-md border hidden md:block">
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
            {invoices.map((inv) => {
              const name = inv.students?.profiles?.full_name || '-';
              const initials = name.charAt(0).toUpperCase();
              const sc = statusConfig[inv.status] || statusConfig.pending;
              return (
                <TableRow key={inv.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                      </Avatar>
                      <span>{name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{isAr ? (inv.courses?.title_ar || inv.courses?.title) : inv.courses?.title || '-'}</TableCell>
                  <TableCell className={`font-semibold ${amountColor[inv.status] || ''}`}>{formatPrice(inv.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {inv.billing_cycle === 'yearly' ? (isAr ? 'سنوي' : 'Yearly') : (isAr ? 'شهري' : 'Monthly')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={sc.bg}>{isAr ? sc.labelAr : sc.label}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{inv.due_date ? format(new Date(inv.due_date), 'MMM dd, yyyy') : '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className={actionBtnClass} onClick={() => onPreview(inv)} title={isAr ? 'معاينة' : 'Preview'}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className={actionBtnClass} onClick={() => window.open(getInvoiceUrl(inv), '_blank')} title={isAr ? 'عرض' : 'View'}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className={actionBtnClass} onClick={() => onCopyUrl(inv)} title={isAr ? 'نسخ الرابط' : 'Copy URL'}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      {isAdmin && onEdit && (
                        <Button variant="ghost" size="icon" className={actionBtnClass} onClick={() => onEdit(inv)} title={isAr ? 'تعديل' : 'Edit'}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {isAdmin && onDelete && (
                        <Button variant="ghost" size="icon" className={`${actionBtnClass} hover:text-destructive hover:bg-destructive/10`} onClick={() => onDelete(inv)} title={isAr ? 'حذف' : 'Delete'}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  {isAr ? 'لا توجد فواتير' : 'No invoices found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default InvoiceTable;
