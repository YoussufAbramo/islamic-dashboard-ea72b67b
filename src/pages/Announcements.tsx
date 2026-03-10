import { useState, useEffect } from 'react';
import { usePagination } from '@/hooks/use-pagination';
import PaginationControls from '@/components/PaginationControls';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Megaphone, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Announcements = () => {
  const { language } = useLanguage();
  const { role, user } = useAuth();
  const isAr = language === 'ar';
  const isAdmin = role === 'admin';

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ title: '', title_ar: '', content: '', content_ar: '', target_audience: 'all', scheduled_at: '' });

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setAnnouncements(data || []);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.content) { toast.error(isAr ? 'يرجى ملء الحقول المطلوبة' : 'Fill required fields'); return; }
    const { error } = await supabase.from('announcements').insert({
      ...form,
      scheduled_at: form.scheduled_at || null,
      created_by: user?.id,
      is_active: true,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(isAr ? 'تم إنشاء الإعلان' : 'Announcement created');
    setCreateOpen(false);
    setForm({ title: '', title_ar: '', content: '', content_ar: '', target_audience: 'all', scheduled_at: '' });
    fetchAnnouncements();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    toast.success(isAr ? 'تم الحذف' : 'Deleted');
    fetchAnnouncements();
    if (selected?.id === id) setDetailOpen(false);
  };

  const filtered = announcements.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.title_ar || '').includes(search)
  );

  const { currentPage, totalPages, paginatedItems, setCurrentPage, totalItems, startIndex, endIndex } = usePagination(filtered);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold shrink-0">{isAr ? 'الإعلانات' : 'Announcements'}</h1>
        <div className="flex items-center gap-2 ms-auto">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 w-48 sm:w-64" />
          </div>
          {isAdmin && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 me-2" />{isAr ? 'إعلان جديد' : 'New Announcement'}
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-muted-foreground">{isAr ? 'لا توجد إعلانات' : 'No announcements'}</CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {paginatedItems.map(a => (
              <Card key={a.id} className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all" onClick={() => { setSelected(a); setDetailOpen(true); }}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-primary" />
                      {isAr && a.title_ar ? a.title_ar : a.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {a.target_audience !== 'all' && <Badge variant="outline" className="text-[10px]">{a.target_audience}</Badge>}
                      {!a.is_active && <Badge variant="secondary" className="text-[10px]">{isAr ? 'غير نشط' : 'Inactive'}</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{isAr && a.content_ar ? a.content_ar : a.content}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {format(new Date(a.created_at), 'MMM dd, yyyy')}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      {format(new Date(a.created_at), 'hh:mm a')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              {selected && (isAr && selected.title_ar ? selected.title_ar : selected?.title)}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm whitespace-pre-wrap">{isAr && selected.content_ar ? selected.content_ar : selected.content}</p>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="outline">{selected.target_audience === 'all' ? (isAr ? 'الجميع' : 'Everyone') : selected.target_audience}</Badge>
                <span>{format(new Date(selected.created_at), 'PPp')}</span>
                {selected.scheduled_at && <span>{isAr ? 'مجدول:' : 'Scheduled:'} {format(new Date(selected.scheduled_at), 'PPp')}</span>}
              </div>
              {isAdmin && (
                <Button variant="destructive" size="sm" onClick={() => handleDelete(selected.id)}>
                  <Trash2 className="h-4 w-4 me-1" />{isAr ? 'حذف' : 'Delete'}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{isAr ? 'إعلان جديد' : 'New Announcement'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{isAr ? 'العنوان' : 'Title'}</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>{isAr ? 'العنوان بالعربية' : 'Title (AR)'}</Label><Input value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} dir="rtl" className="text-right" /></div>
            <div><Label>{isAr ? 'المحتوى' : 'Content'}</Label><Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={3} /></div>
            <div><Label>{isAr ? 'المحتوى بالعربية' : 'Content (AR)'}</Label><Textarea value={form.content_ar} onChange={e => setForm({ ...form, content_ar: e.target.value })} dir="rtl" className="text-right" rows={3} /></div>
            <div>
              <Label>{isAr ? 'الجمهور المستهدف' : 'Target Audience'}</Label>
              <Select value={form.target_audience} onValueChange={v => setForm({ ...form, target_audience: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? 'الجميع' : 'Everyone'}</SelectItem>
                  <SelectItem value="teachers">{isAr ? 'المعلمون' : 'Teachers'}</SelectItem>
                  <SelectItem value="students">{isAr ? 'الطلاب' : 'Students'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? 'جدولة (اختياري)' : 'Schedule (optional)'}</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} />
            </div>
            <Button onClick={handleCreate} className="w-full">{isAr ? 'إنشاء' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Announcements;
