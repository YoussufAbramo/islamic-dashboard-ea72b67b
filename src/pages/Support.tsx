import { useState, useEffect, useMemo } from 'react';
import { usePagination } from '@/hooks/use-pagination';
import PaginationControls from '@/components/PaginationControls';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Plus, Search, Eye, MessageSquare, Mail, Phone, ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ticketStatusLabels, ticketPriorityLabels, getLabel } from '@/lib/statusLabels';
import { TableSkeleton } from '@/components/PageSkeleton';

type SortOrder = 'newest' | 'oldest';

const priorityColors: Record<string, string> = { low: 'secondary', medium: 'default', high: 'destructive', urgent: 'destructive' };
const statusColors: Record<string, string> = { open: 'default', in_progress: 'secondary', resolved: 'outline', closed: 'outline' };

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const Support = () => {
  const { t, language } = useLanguage();
  const { user, role } = useAuth();
  const isAr = language === 'ar';
  const isAdmin = role === 'admin';
  const [tickets, setTickets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', department: 'general', priority: 'medium' });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    setTickets(data || []);
  };

  useEffect(() => { fetchTickets(); }, []);

  const createTicket = async () => {
    await supabase.from('support_tickets').insert({ ...form, user_id: user?.id });
    toast.success(isAr ? 'تم إنشاء التذكرة' : 'Ticket created');
    setCreateOpen(false);
    setForm({ name: '', email: '', phone: '', subject: '', message: '', department: 'general', priority: 'medium' });
    fetchTickets();
  };

  const updateStatus = async (ticketId: string, status: string) => {
    await supabase.from('support_tickets').update({ status }).eq('id', ticketId);
    toast.success(isAr ? 'تم تحديث الحالة' : 'Status updated');
    fetchTickets();
    if (selected?.id === ticketId) setSelected({ ...selected, status });
  };

  const saveResolutionNotes = async () => {
    if (!selected) return;
    await supabase.from('support_tickets').update({ resolution_notes: resolutionNotes }).eq('id', selected.id);
    toast.success(isAr ? 'تم حفظ الملاحظات' : 'Notes saved');
    setSelected({ ...selected, resolution_notes: resolutionNotes });
    fetchTickets();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('support_tickets').delete().eq('id', deleteTarget);
    toast.success(isAr ? 'تم حذف التذكرة' : 'Ticket deleted');
    setDeleteTarget(null);
    fetchTickets();
  };

  const openDetail = (ticket: any) => {
    setSelected(ticket);
    setResolutionNotes(ticket.resolution_notes || '');
    setDetailOpen(true);
  };

  const statusCounts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  };

  const statusTabs = [
    { value: 'all', label: isAr ? 'الكل' : 'All' },
    { value: 'open', label: isAr ? 'مفتوحة' : 'Open' },
    { value: 'in_progress', label: isAr ? 'قيد المعالجة' : 'In Progress' },
    { value: 'resolved', label: isAr ? 'تم الحل' : 'Resolved' },
    { value: 'closed', label: isAr ? 'مغلقة' : 'Closed' },
  ];

  const filtered = useMemo(() => {
    let result = tickets.filter((t) => {
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
    result.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return result;
  }, [tickets, search, sortOrder, statusFilter]);

  const { currentPage, totalPages, paginatedItems, setCurrentPage, totalItems, startIndex, endIndex } = usePagination(filtered);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold shrink-0">{t('support.title')}</h1>
        <div className="flex items-center gap-2 ms-auto">
          <Button variant="outline" size="sm" onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className="gap-1 h-9">
            {sortOrder === 'newest' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
            {sortOrder === 'newest' ? (isAr ? 'الأحدث' : 'Newest') : (isAr ? 'الأقدم' : 'Oldest')}
          </Button>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 w-48 sm:w-64 h-9" />
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button size="sm" className="h-9"><Plus className="h-4 w-4 me-2" />{t('support.createTicket')}</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{t('support.createTicket')}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>{t('students.name')}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>{t('students.email')}</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div><Label>{t('students.phone')}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>{t('support.subject')}</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
                <div><Label>{t('support.message')}</Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t('support.department')}</Label>
                    <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">{t('support.general')}</SelectItem>
                        <SelectItem value="technical">{t('support.technical')}</SelectItem>
                        <SelectItem value="billing">{t('support.billing')}</SelectItem>
                        <SelectItem value="academic">{t('support.academic')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('support.priority')}</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{t('support.low')}</SelectItem>
                        <SelectItem value="medium">{t('support.medium')}</SelectItem>
                        <SelectItem value="high">{t('support.high')}</SelectItem>
                        <SelectItem value="urgent">{t('support.urgent')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={createTicket} className="w-full">{t('common.create')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('support.subject')}</TableHead>
              <TableHead>{t('students.name')}</TableHead>
              <TableHead>{t('support.department')}</TableHead>
              <TableHead>{t('support.priority')}</TableHead>
              <TableHead>{t('support.status')}</TableHead>
              <TableHead>{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">{ticket.subject}</TableCell>
                <TableCell>{ticket.name}</TableCell>
                <TableCell>{ticket.department}</TableCell>
                <TableCell><Badge variant={priorityColors[ticket.priority] as any}>{getLabel(ticketPriorityLabels, ticket.priority, isAr)}</Badge></TableCell>
                <TableCell><Badge variant={statusColors[ticket.status] as any}>{getLabel(ticketStatusLabels, ticket.status, isAr)}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted h-8 w-8" onClick={() => openDetail(ticket)}><Eye className="h-3.5 w-3.5" /></Button>
                    {isAdmin && <Button variant="ghost" size="icon" className="rounded-full hover:bg-destructive/10 text-destructive hover:text-destructive h-8 w-8" onClick={() => setDeleteTarget(ticket.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'حذف التذكرة' : 'Delete Ticket'}</AlertDialogTitle>
            <AlertDialogDescription>{isAr ? 'هل أنت متأكد من حذف هذه التذكرة؟' : 'Are you sure you want to delete this ticket?'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>{isAr ? 'حذف' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              {selected?.subject}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">{isAr ? 'التفاصيل' : 'Details'}</TabsTrigger>
                <TabsTrigger value="notes">{isAr ? 'الملاحظات' : 'Notes'}</TabsTrigger>
                <TabsTrigger value="contact">{isAr ? 'التواصل' : 'Contact'}</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card><CardContent className="pt-4"><Label className="text-xs text-muted-foreground">{t('students.name')}</Label><p className="font-medium">{selected.name}</p></CardContent></Card>
                  <Card><CardContent className="pt-4"><Label className="text-xs text-muted-foreground">{t('students.email')}</Label><p className="font-medium">{selected.email}</p></CardContent></Card>
                  <Card><CardContent className="pt-4"><Label className="text-xs text-muted-foreground">{t('support.department')}</Label><p className="font-medium">{selected.department}</p></CardContent></Card>
                  <Card><CardContent className="pt-4"><Label className="text-xs text-muted-foreground">{t('support.priority')}</Label><Badge variant={priorityColors[selected.priority] as any}>{getLabel(ticketPriorityLabels, selected.priority, isAr)}</Badge></CardContent></Card>
                </div>
                <Card>
                  <CardContent className="pt-4">
                    <Label className="text-xs text-muted-foreground">{t('support.message')}</Label>
                    <p className="mt-1 text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">{selected.message}</p>
                  </CardContent>
                </Card>
                <div className="flex items-center gap-3">
                  <Label className="text-sm">{t('support.status')}</Label>
                  <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">{t('support.open')}</SelectItem>
                      <SelectItem value="in_progress">{t('support.inProgress')}</SelectItem>
                      <SelectItem value="resolved">{t('support.resolved')}</SelectItem>
                      <SelectItem value="closed">{t('support.closed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">{isAr ? 'تاريخ الإنشاء:' : 'Created:'} {format(new Date(selected.created_at), 'PPp')}</p>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4 mt-4">
                <div>
                  <Label>{isAr ? 'ملاحظات الحل' : 'Resolution Notes'}</Label>
                  <Textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} rows={6} placeholder={isAr ? 'اكتب ملاحظات حول هذه التذكرة...' : 'Write notes about this ticket...'} className="mt-2" />
                </div>
                <Button onClick={saveResolutionNotes} size="sm">{isAr ? 'حفظ الملاحظات' : 'Save Notes'}</Button>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">{isAr ? 'تواصل مع صاحب التذكرة' : 'Contact the ticket owner'}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selected.phone && (
                    <a href={`https://wa.me/${selected.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full"><WhatsAppIcon /> <span className="ms-2">WhatsApp</span></Button>
                    </a>
                  )}
                  {selected.email && (
                    <a href={`mailto:${selected.email}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full"><Mail className="h-4 w-4 me-2" /> {isAr ? 'بريد إلكتروني' : 'Email'}</Button>
                    </a>
                  )}
                  {selected.phone && (
                    <a href={`tel:${selected.phone}`}>
                      <Button variant="outline" className="w-full"><Phone className="h-4 w-4 me-2" /> {isAr ? 'اتصال' : 'Call'}</Button>
                    </a>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Support;
