import { useState, useEffect, useMemo } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/PageSkeleton';
import PayoutStatsCards from '@/components/payouts/PayoutStatsCards';
import PayoutTable from '@/components/payouts/PayoutTable';
import PayoutEmptyState from '@/components/payouts/PayoutEmptyState';

const PayoutRequests = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === 'ar';
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

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
    const rows = data || [];
    // Enrich with admin profile names
    const adminIds = [...new Set(rows.filter(r => r.admin_id).map(r => r.admin_id))];
    if (adminIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', adminIds);
      const nameMap: Record<string, string> = {};
      (profiles || []).forEach(p => { nameMap[p.id] = p.full_name; });
      rows.forEach(r => { if (r.admin_id) r.admin_profile_name = nameMap[r.admin_id] || '-'; });
    }
    setRequests(rows);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const statusCounts = {
    all: requests.length,
    under_review: requests.filter(r => r.status === 'under_review').length,
    approved: requests.filter(r => r.status === 'approved').length,
    declined: requests.filter(r => r.status === 'declined').length,
  };

  const statusTabs = [
    { value: 'all', label: isAr ? 'الكل' : 'All' },
    { value: 'under_review', label: isAr ? 'قيد المراجعة' : 'Under Review' },
    { value: 'approved', label: isAr ? 'مقبول' : 'Approved' },
    { value: 'declined', label: isAr ? 'مرفوض' : 'Declined' },
  ];

  const filtered = useMemo(() => {
    let result = requests.filter((r) => {
      const name = r.teachers?.profiles?.full_name || '';
      const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || r.transaction_ref?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
    result.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return result;
  }, [requests, statusFilter, search, sortOrder]);

  const { currentPage, totalPages, paginatedItems, setCurrentPage, totalItems, startIndex, endIndex } = usePagination(filtered);

  const showEmptyState = !loading && requests.length === 0;

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

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold shrink-0">{isAr ? 'طلبات الصرف' : 'Payout Requests'}</h1>
        <div className="flex items-center gap-2 ms-auto">
          <Button variant="outline" size="sm" onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className="gap-1 h-9">
            {sortOrder === 'newest' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
            {sortOrder === 'newest' ? (isAr ? 'الأحدث' : 'Newest') : (isAr ? 'الأقدم' : 'Oldest')}
          </Button>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? 'بحث...' : 'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 w-48 sm:w-64" />
          </div>
        </div>
      </div>

      <PayoutStatsCards requests={requests} loading={loading} isAr={isAr} />

      {showEmptyState ? (
        <PayoutEmptyState isAr={isAr} />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
              <TabsList>
                {statusTabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-1.5">
                    {tab.label}
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-[18px]">
                      {statusCounts[tab.value as keyof typeof statusCounts]}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <PayoutTable
            requests={paginatedItems}
            loading={loading}
            isAr={isAr}
            onApprove={(req) => openReview(req, 'approve')}
            onDecline={(req) => openReview(req, 'decline')}
          />
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />
        </>
      )}

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
                <Label>{reviewAction === 'approve' ? (isAr ? 'ملاحظة للمعلم' : 'Note to Teacher') : (isAr ? 'ملاحظات إضافية' : 'Admin Notes (optional)')}</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={reviewAction === 'approve' ? (isAr ? 'أضف ملاحظة للمعلم (اختياري)...' : 'Add a note for the teacher (optional)...') : (isAr ? 'ملاحظات...' : 'Notes...')}
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
              variant={reviewAction === 'decline' ? 'destructive' : 'default'}
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
