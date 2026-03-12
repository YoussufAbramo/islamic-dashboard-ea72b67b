import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePagination } from '@/hooks/use-pagination';
import PaginationControls from '@/components/PaginationControls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Search, Eye, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/PageSkeleton';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const PayoutRequests = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAr = language === 'ar';
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Review dialog
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'decline' | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('payout_requests')
      .select('*, teachers!inner(id, user_id, profiles:teachers_user_id_profiles_fkey(full_name, email))')
      .order('created_at', { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const filtered = requests.filter((r) => {
    const name = r.teachers?.profiles?.full_name || '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || r.transaction_ref?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const { currentPage, totalPages, paginatedItems, setCurrentPage, totalItems, startIndex, endIndex } = usePagination(filtered);

  const openReview = (req: any, action: 'approve' | 'decline') => {
    setSelected(req);
    setReviewAction(action);
    setDeclineReason('');
    setAdminNotes('');
    setReviewOpen(true);
  };

  const handleReview = async () => {
    if (!selected || !reviewAction || !user) return;
    if (reviewAction === 'decline' && !declineReason.trim()) {
      toast.error(isAr ? 'سبب الرفض مطلوب' : 'Decline reason is required');
      return;
    }
    setReviewLoading(true);

    const updateData: any = {
      status: reviewAction === 'approve' ? 'approved' : 'declined',
      admin_id: user.id,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes || null,
    };
    if (reviewAction === 'decline') {
      updateData.decline_reason = declineReason;
    }

    const { error } = await supabase
      .from('payout_requests')
      .update(updateData)
      .eq('id', selected.id);

    setReviewLoading(false);
    if (error) {
      toast.error(isAr ? 'فشل في تحديث الطلب' : 'Failed to update request');
    } else {
      toast.success(
        reviewAction === 'approve'
          ? (isAr ? 'تمت الموافقة على الطلب' : 'Request approved')
          : (isAr ? 'تم رفض الطلب' : 'Request declined')
      );
      setReviewOpen(false);
      fetchRequests();
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'under_review': return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">{isAr ? 'قيد المراجعة' : 'Under Review'}</Badge>;
      case 'approved': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border">{isAr ? 'مقبول' : 'Approved'}</Badge>;
      case 'declined': return <Badge variant="destructive">{isAr ? 'مرفوض' : 'Declined'}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold shrink-0">{isAr ? 'طلبات الصرف' : 'Payout Requests'}</h1>
        <div className="flex items-center gap-2 ms-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
              <SelectItem value="under_review">{isAr ? 'قيد المراجعة' : 'Under Review'}</SelectItem>
              <SelectItem value="approved">{isAr ? 'مقبول' : 'Approved'}</SelectItem>
              <SelectItem value="declined">{isAr ? 'مرفوض' : 'Declined'}</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? 'بحث...' : 'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 w-48 sm:w-64" />
          </div>
        </div>
      </div>

      <div className="rounded-md border">
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
            {paginatedItems.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-mono text-xs">{req.transaction_ref}</TableCell>
                <TableCell>
                  <button
                    className="text-start hover:underline text-primary font-medium"
                    onClick={() => navigate(`/dashboard/teacher-profile/${req.teacher_id}`)}
                  >
                    {req.teachers?.profiles?.full_name || '-'}
                  </button>
                </TableCell>
                <TableCell className="font-semibold">${Number(req.requested_amount).toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground">${Number(req.available_balance_at_request).toFixed(2)}</TableCell>
                <TableCell>{format(new Date(req.created_at), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{statusBadge(req.status)}</TableCell>
                <TableCell>
                  {req.status === 'under_review' ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => openReview(req, 'approve')}>
                        <CheckCircle className="h-3.5 w-3.5 me-1" />{isAr ? 'قبول' : 'Approve'}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-500/30 hover:bg-red-500/10" onClick={() => openReview(req, 'decline')}>
                        <XCircle className="h-3.5 w-3.5 me-1" />{isAr ? 'رفض' : 'Decline'}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {req.reviewed_at ? format(new Date(req.reviewed_at), 'dd/MM/yyyy') : '-'}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {isAr ? 'لا توجد طلبات' : 'No payout requests'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve'
                ? (isAr ? 'الموافقة على الطلب' : 'Approve Request')
                : (isAr ? 'رفض الطلب' : 'Decline Request')}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? 'المعلم' : 'Teacher'}</span>
                  <span className="font-medium">{selected.teachers?.profiles?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? 'المبلغ' : 'Amount'}</span>
                  <span className="font-semibold">${Number(selected.requested_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? 'المرجع' : 'Ref'}</span>
                  <span className="font-mono text-xs">{selected.transaction_ref}</span>
                </div>
              </div>

              {reviewAction === 'decline' && (
                <div>
                  <Label>{isAr ? 'سبب الرفض *' : 'Decline Reason *'}</Label>
                  <Textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder={isAr ? 'أدخل سبب الرفض...' : 'Enter decline reason...'}
                    maxLength={500}
                  />
                </div>
              )}

              <div>
                <Label>{isAr ? 'ملاحظات إضافية' : 'Admin Notes (optional)'}</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={isAr ? 'ملاحظات...' : 'Notes...'}
                  maxLength={500}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button
              onClick={handleReview}
              disabled={reviewLoading}
              className={reviewAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-destructive hover:bg-destructive/90'}
            >
              {reviewAction === 'approve' ? (isAr ? 'تأكيد الموافقة' : 'Confirm Approve') : (isAr ? 'تأكيد الرفض' : 'Confirm Decline')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayoutRequests;
