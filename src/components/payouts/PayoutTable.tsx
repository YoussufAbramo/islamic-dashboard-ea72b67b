import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const statusConfig: Record<string, { bg: string; label: string; labelAr: string }> = {
  under_review: { bg: 'bg-amber-500/10 text-amber-600 border-amber-500/30', label: 'Under Review', labelAr: 'قيد المراجعة' },
  approved: { bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', label: 'Approved', labelAr: 'مقبول' },
  declined: { bg: 'bg-red-500/10 text-red-600 border-red-500/30', label: 'Declined', labelAr: 'مرفوض' },
};

interface Props {
  requests: any[];
  loading: boolean;
  isAr: boolean;
  onApprove: (req: any) => void;
  onDecline: (req: any) => void;
}

const PayoutTable = ({ requests, loading, isAr, onApprove, onDecline }: Props) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: 7 }).map((_, i) => (
                <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Mobile card layout
  const mobileCards = (
    <div className="flex flex-col gap-3 md:hidden">
      {requests.map((req) => {
        const name = req.teachers?.profiles?.full_name || '-';
        const initials = name.charAt(0).toUpperCase();
        const sc = statusConfig[req.status] || statusConfig.under_review;
        return (
          <div key={req.id} className="rounded-lg border p-4 space-y-3 bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <button className="font-medium text-sm text-start hover:underline text-primary" onClick={() => navigate(`/dashboard/teacher-profile/${req.teacher_id}`)}>
                    {name}
                  </button>
                  <p className="text-xs text-muted-foreground font-mono">{req.transaction_ref}</p>
                </div>
              </div>
              <Badge variant="outline" className={sc.bg}>{isAr ? sc.labelAr : sc.label}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold">${Number(req.requested_amount).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(req.created_at), 'MMM dd, yyyy HH:mm')}</p>
            </div>
            {req.status === 'under_review' && (
              <div className="flex gap-2 pt-1 border-t border-border">
                <Button variant="ghost" size="sm" className="flex-1 text-emerald-600" onClick={() => onApprove(req)}>
                  <CheckCircle className="h-4 w-4 me-1" />{isAr ? 'قبول' : 'Approve'}
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 text-destructive" onClick={() => onDecline(req)}>
                  <XCircle className="h-4 w-4 me-1" />{isAr ? 'رفض' : 'Decline'}
                </Button>
              </div>
            )}
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
              <TableHead>{isAr ? 'المرجع' : 'Ref'}</TableHead>
              <TableHead>{isAr ? 'المعلم' : 'Teacher'}</TableHead>
              <TableHead>{isAr ? 'المبلغ' : 'Amount'}</TableHead>
              <TableHead>{isAr ? 'الرصيد عند الطلب' : 'Balance at Request'}</TableHead>
              <TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
              <TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead>
              <TableHead>{isAr ? 'إجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => {
              const name = req.teachers?.profiles?.full_name || '-';
              const initials = name.charAt(0).toUpperCase();
              const sc = statusConfig[req.status] || statusConfig.under_review;
              return (
                <TableRow key={req.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-xs">{req.transaction_ref}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                      </Avatar>
                      <button
                        className="text-start hover:underline text-primary font-medium"
                        onClick={() => navigate(`/dashboard/teacher-profile/${req.teacher_id}`)}
                      >
                        {name}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">${Number(req.requested_amount).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground">${Number(req.available_balance_at_request).toFixed(2)}</TableCell>
                  <TableCell className="text-sm">{format(new Date(req.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={sc.bg}>{isAr ? sc.labelAr : sc.label}</Badge>
                  </TableCell>
                  <TableCell>
                    {req.status === 'under_review' ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => onApprove(req)}>
                          <CheckCircle className="h-3.5 w-3.5 me-1" />{isAr ? 'قبول' : 'Approve'}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => onDecline(req)}>
                          <XCircle className="h-3.5 w-3.5 me-1" />{isAr ? 'رفض' : 'Decline'}
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {req.reviewed_at ? format(new Date(req.reviewed_at), 'MMM dd, yyyy HH:mm') : '-'}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  {isAr ? 'لا توجد طلبات صرف' : 'No payout requests found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default PayoutTable;
