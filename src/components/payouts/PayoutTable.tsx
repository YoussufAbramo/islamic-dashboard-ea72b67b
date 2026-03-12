import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { ACTION_BTN, ACTION_ICON } from '@/lib/actionBtnClass';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

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
  const [detailReq, setDetailReq] = useState<any>(null);

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

  const getBalBefore = (req: any) => Number(req.available_balance_at_request) + Number(req.requested_amount);
  const getBalAfter = (req: any) => Number(req.available_balance_at_request);
  const formatDate = (d: string) => format(new Date(d), 'MMM dd, yyyy HH:mm');

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
              <p className="text-xs text-muted-foreground">{formatDate(req.created_at)}</p>
            </div>
            <div className="flex gap-2 pt-1 border-t border-border">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => setDetailReq(req)}>
                <Eye className="h-4 w-4 me-1" />{isAr ? 'التفاصيل' : 'Details'}
              </Button>
              {req.status === 'under_review' && (
                <>
                  <Button variant="ghost" size="sm" className="flex-1 text-emerald-600" onClick={() => onApprove(req)}>
                    <CheckCircle className="h-4 w-4 me-1" />{isAr ? 'قبول' : 'Approve'}
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 text-destructive" onClick={() => onDecline(req)}>
                    <XCircle className="h-4 w-4 me-1" />{isAr ? 'رفض' : 'Decline'}
                  </Button>
                </>
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
              <TableHead>{isAr ? 'المرجع' : 'Ref ID'}</TableHead>
              <TableHead>{isAr ? 'المعلم' : 'Teacher'}</TableHead>
              <TableHead>{isAr ? 'تاريخ الطلب' : 'Date of Request'}</TableHead>
              <TableHead>{isAr ? 'الرصيد قبل' : 'Bal Before'}</TableHead>
              <TableHead>{isAr ? 'مبلغ الصرف' : 'Payout Amount'}</TableHead>
              <TableHead>{isAr ? 'الرصيد بعد' : 'Bal After'}</TableHead>
              <TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead>
              <TableHead>{isAr ? 'إجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => {
              const name = req.teachers?.profiles?.full_name || '-';
              const initials = name.charAt(0).toUpperCase();
              const sc = statusConfig[req.status] || statusConfig.under_review;
              const reviewedDate = req.reviewed_at ? formatDate(req.reviewed_at) : null;
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
                  <TableCell className="text-sm">{formatDate(req.created_at)}</TableCell>
                  <TableCell className="text-muted-foreground">${getBalBefore(req).toFixed(2)}</TableCell>
                  <TableCell className="font-semibold">${Number(req.requested_amount).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground">${getBalAfter(req).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={sc.bg}>{isAr ? sc.labelAr : sc.label}</Badge>
                    {reviewedDate && req.status !== 'under_review' && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{reviewedDate}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className={ACTION_BTN} onClick={() => setDetailReq(req)} title={isAr ? 'التفاصيل' : 'Details'}>
                        <Eye className={ACTION_ICON} />
                      </Button>
                      {req.status === 'under_review' && (
                        <>
                          <Button variant="ghost" size="icon" className={`${ACTION_BTN} hover:text-emerald-600 hover:bg-emerald-500/10`} onClick={() => onApprove(req)} title={isAr ? 'قبول' : 'Approve'}>
                            <CheckCircle className={ACTION_ICON} />
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => onDecline(req)} title={isAr ? 'رفض' : 'Decline'}>
                            <XCircle className={ACTION_ICON} />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  {isAr ? 'لا توجد طلبات صرف' : 'No payout requests found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Request Details Dialog */}
      <Dialog open={!!detailReq} onOpenChange={(open) => !open && setDetailReq(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              {isAr ? 'تفاصيل الطلب' : 'Request Details'}
            </DialogTitle>
          </DialogHeader>
          {detailReq && (() => {
            const name = detailReq.teachers?.profiles?.full_name || '-';
            return (
              <div className="space-y-3">
                <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'المعلم' : 'Teacher'}</span><span className="font-medium">{name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'المرجع' : 'Ref ID'}</span><span className="font-mono text-xs">{detailReq.transaction_ref}</span></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الرصيد قبل' : 'Bal Before'}</span><span>${getBalBefore(detailReq).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'مبلغ الصرف' : 'Payout Amount'}</span><span className="font-semibold">${Number(detailReq.requested_amount).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الرصيد بعد' : 'Bal After'}</span><span>${getBalAfter(detailReq).toFixed(2)}</span></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'تاريخ الطلب' : 'Date of Request'}</span><span>{formatDate(detailReq.created_at)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الحالة' : 'Status'}</span><Badge variant="outline" className={statusConfig[detailReq.status]?.bg}>{isAr ? statusConfig[detailReq.status]?.labelAr : statusConfig[detailReq.status]?.label}</Badge></div>
                  {detailReq.reviewed_at && (
                    <>
                      <Separator />
                      <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'تاريخ المراجعة' : 'Reviewed At'}</span><span>{formatDate(detailReq.reviewed_at)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'بواسطة' : 'Reviewed By'}</span><span className="font-medium">{detailReq.admin_profile_name || '-'}</span></div>
                    </>
                  )}
                  {detailReq.decline_reason && (
                    <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'سبب الرفض' : 'Decline Reason'}</span><span className="text-destructive text-xs max-w-[200px] text-end">{detailReq.decline_reason}</span></div>
                  )}
                  {detailReq.admin_notes && (
                    <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'ملاحظات المشرف' : 'Admin Notes'}</span><span className="text-xs max-w-[200px] text-end">{detailReq.admin_notes}</span></div>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PayoutTable;
