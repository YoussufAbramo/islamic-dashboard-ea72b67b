import { useState, useEffect, useMemo } from 'react';
import { usePagination } from '@/hooks/use-pagination';
import PaginationControls from '@/components/PaginationControls';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Search, Eye, Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionStatusLabels, subscriptionTypeLabels, getLabel } from '@/lib/statusLabels';
import { addDays, addYears } from 'date-fns';

const Subscriptions = () => {
  const { t, language } = useLanguage();
  const { role } = useAuth();
  const { currency } = useAppSettings();
  const isAr = language === 'ar';
  const isAdmin = role === 'admin';
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ subscription_type: 'monthly', status: 'active', renewal_date: '', teacher_id: '', course_id: '' });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Create subscription
  const [createOpen, setCreateOpen] = useState(false);
  const [students, setStudentsList] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachersList] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [createForm, setCreateForm] = useState({ student_id: '', course_id: '', teacher_id: '', subscription_type: 'monthly', price: '', start_date: new Date().toISOString().split('T')[0], renewal_date: '', weekly_lessons: '1', lesson_duration: '60' });
  const [createLoading, setCreateLoading] = useState(false);

  const fetchSubscriptions = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*, courses:course_id(title), students:student_id(user_id, profiles:students_user_id_profiles_fkey(full_name)), teachers_rel:teacher_id(user_id, profiles:teachers_user_id_profiles_fkey(full_name))')
      .order('created_at', { ascending: false });
    setSubscriptions(data || []);
  };

  const fetchFormData = async () => {
    const [s, c, te] = await Promise.all([
      supabase.from('students').select('id, profiles:students_user_id_profiles_fkey(full_name)'),
      supabase.from('courses').select('id, title'),
      supabase.from('teachers').select('id, profiles:teachers_user_id_profiles_fkey(full_name)'),
    ]);
    setStudentsList(s.data || []);
    setCourses(c.data || []);
    setTeachersList(te.data || []);
  };

  useEffect(() => { fetchSubscriptions(); }, []);

  // Auto-calculate renewal date
  useEffect(() => {
    if (createForm.start_date && createForm.subscription_type) {
      const start = new Date(createForm.start_date);
      const renewal = createForm.subscription_type === 'yearly'
        ? addYears(start, 1)
        : addDays(start, 30);
      setCreateForm(prev => ({ ...prev, renewal_date: renewal.toISOString().split('T')[0] }));
    }
  }, [createForm.start_date, createForm.subscription_type]);

  const viewDetails = (sub: any) => {
    setSelected(sub);
    setEditForm({ subscription_type: sub.subscription_type, status: sub.status, renewal_date: sub.renewal_date || '', teacher_id: sub.teacher_id || '', course_id: sub.course_id || '' });
    setDetailOpen(true);
    setEditing(false);
    fetchFormData();
  };

  const saveEdit = async () => {
    await supabase.from('subscriptions').update({
      subscription_type: editForm.subscription_type,
      status: editForm.status,
      renewal_date: editForm.renewal_date || null,
      teacher_id: editForm.teacher_id || null,
      course_id: editForm.course_id || null,
    }).eq('id', selected.id);
    toast.success(isAr ? 'تم تحديث الاشتراك' : 'Subscription updated');
    setEditing(false);
    fetchSubscriptions();
  };

  const handleCreate = async () => {
    setCreateLoading(true);
    const { error } = await supabase.from('subscriptions').insert({
      student_id: createForm.student_id || null,
      course_id: createForm.course_id || null,
      teacher_id: createForm.teacher_id || null,
      subscription_type: createForm.subscription_type,
      price: parseFloat(createForm.price) || 0,
      start_date: createForm.start_date,
      renewal_date: createForm.renewal_date || null,
      weekly_lessons: parseInt(createForm.weekly_lessons) || 1,
      lesson_duration: parseInt(createForm.lesson_duration) || 60,
    });
    setCreateLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isAr ? 'تم إنشاء الاشتراك' : 'Subscription created');
      setCreateOpen(false);
      setCreateForm({ student_id: '', course_id: '', teacher_id: '', subscription_type: 'monthly', price: '', start_date: new Date().toISOString().split('T')[0], renewal_date: '', weekly_lessons: '1', lesson_duration: '60' });
      fetchSubscriptions();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('subscriptions').delete().eq('id', deleteTarget);
    toast.success(isAr ? 'تم حذف الاشتراك' : 'Subscription deleted');
    setDeleteTarget(null);
    fetchSubscriptions();
  };

  const statusColors: Record<string, string> = { active: 'default', expired: 'secondary', cancelled: 'destructive' };

  const statusCounts = {
    all: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    expired: subscriptions.filter(s => s.status === 'expired').length,
    cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
  };

  const statusTabs = [
    { value: 'all', label: isAr ? 'الكل' : 'All' },
    { value: 'active', label: isAr ? 'نشط' : 'Active' },
    { value: 'expired', label: isAr ? 'منتهي' : 'Expired' },
    { value: 'cancelled', label: isAr ? 'ملغي' : 'Cancelled' },
  ];

  const filtered = useMemo(() => {
    let result = subscriptions.filter((s) => {
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const studentName = s.students?.profiles?.full_name || '';
      const courseName = s.courses?.title || '';
      const matchesSearch = studentName.toLowerCase().includes(search.toLowerCase()) || courseName.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
    result.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return result;
  }, [subscriptions, search, sortOrder, statusFilter]);

  const { currentPage, totalPages, paginatedItems, setCurrentPage, totalItems, startIndex, endIndex } = usePagination(filtered);

  const filteredStudents = students.filter(s => !studentSearch || (s.profiles?.full_name || '').toLowerCase().includes(studentSearch.toLowerCase()));
  const filteredCourses = courses.filter(c => !courseSearch || (c.title || '').toLowerCase().includes(courseSearch.toLowerCase()));
  const filteredTeachers = teachers.filter(t => !teacherSearch || (t.profiles?.full_name || '').toLowerCase().includes(teacherSearch.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold shrink-0">{t('subscriptions.title')}</h1>
        <div className="flex items-center gap-2 ms-auto">
          <Button variant="outline" size="sm" onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className="gap-1">
            {sortOrder === 'newest' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
            {sortOrder === 'newest' ? (isAr ? 'الأحدث' : 'Newest') : (isAr ? 'الأقدم' : 'Oldest')}
          </Button>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 w-48 sm:w-64" />
          </div>
          {isAdmin && (
            <Button onClick={() => { setCreateOpen(true); fetchFormData(); }}>
              <Plus className="h-4 w-4 me-2" />
              {isAr ? 'إنشاء اشتراك' : 'Create Subscription'}
            </Button>
          )}
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
              <TableHead>{t('subscriptions.student')}</TableHead>
              <TableHead>{t('subscriptions.course')}</TableHead>
              <TableHead>{t('subscriptions.teacher')}</TableHead>
              <TableHead>{t('subscriptions.type')}</TableHead>
              <TableHead>{t('subscriptions.status')}</TableHead>
              <TableHead>{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">{sub.students?.profiles?.full_name || '-'}</TableCell>
                <TableCell>{sub.courses?.title || '-'}</TableCell>
                <TableCell>{sub.teachers_rel?.profiles?.full_name || '-'}</TableCell>
                <TableCell>{getLabel(subscriptionTypeLabels, sub.subscription_type, isAr)}</TableCell>
                <TableCell><Badge variant={statusColors[sub.status] as any}>{getLabel(subscriptionStatusLabels, sub.status, isAr)}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => viewDetails(sub)}><Eye className="h-4 w-4" /></Button>
                    {isAdmin && <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(sub.id)}><Trash2 className="h-4 w-4" /></Button>}
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
            <AlertDialogTitle>{isAr ? 'حذف الاشتراك' : 'Delete Subscription'}</AlertDialogTitle>
            <AlertDialogDescription>{isAr ? 'هل أنت متأكد من حذف هذا الاشتراك؟' : 'Are you sure you want to delete this subscription?'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>{isAr ? 'حذف' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t('subscriptions.title')}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t('subscriptions.student')}</Label><p>{selected.students?.profiles?.full_name}</p></div>
                <div><Label>{t('subscriptions.course')}</Label><p>{selected.courses?.title}</p></div>
                <div><Label>{t('subscriptions.teacher')}</Label><p>{selected.teachers_rel?.profiles?.full_name || '-'}</p></div>
                <div><Label>{t('subscriptions.startDate')}</Label><p>{selected.start_date}</p></div>
              </div>
              {editing ? (
                <div className="space-y-3 border-t pt-3">
                  <div>
                    <Label>{t('subscriptions.type')}</Label>
                    <Select value={editForm.subscription_type} onValueChange={(v) => setEditForm({ ...editForm, subscription_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">{isAr ? 'شهري' : 'Monthly'}</SelectItem>
                        <SelectItem value="yearly">{isAr ? 'سنوي' : 'Yearly'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('subscriptions.course')}</Label>
                    <Select value={editForm.course_id} onValueChange={(v) => setEditForm({ ...editForm, course_id: v })}>
                      <SelectTrigger><SelectValue placeholder={isAr ? 'اختر دورة' : 'Select course'} /></SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('subscriptions.teacher')}</Label>
                    <Select value={editForm.teacher_id} onValueChange={(v) => setEditForm({ ...editForm, teacher_id: v })}>
                      <SelectTrigger><SelectValue placeholder={isAr ? 'اختر معلم' : 'Select teacher'} /></SelectTrigger>
                      <SelectContent>
                        {teachers.map((te) => (
                          <SelectItem key={te.id} value={te.id}>{te.profiles?.full_name || te.id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>{t('subscriptions.renewalDate')}</Label><Input type="date" value={editForm.renewal_date} onChange={(e) => setEditForm({ ...editForm, renewal_date: e.target.value })} /></div>
                  <div>
                    <Label>{t('subscriptions.status')}</Label>
                    <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{isAr ? 'نشط' : 'Active'}</SelectItem>
                        <SelectItem value="expired">{isAr ? 'منتهي' : 'Expired'}</SelectItem>
                        <SelectItem value="cancelled">{isAr ? 'ملغي' : 'Cancelled'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveEdit}>{t('common.save')}</Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>{t('common.cancel')}</Button>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>{t('subscriptions.type')}</Label><p>{getLabel(subscriptionTypeLabels, selected.subscription_type, isAr)}</p></div>
                    <div><Label>{t('subscriptions.renewalDate')}</Label><p>{selected.renewal_date || '-'}</p></div>
                    <div><Label>{t('subscriptions.status')}</Label><Badge variant={statusColors[selected.status] as any}>{getLabel(subscriptionStatusLabels, selected.status, isAr)}</Badge></div>
                    <div><Label>{isAr ? 'السعر' : 'Price'}</Label><p>{currency.symbol}{selected.price}</p></div>
                  </div>
                  {isAdmin && <Button variant="outline" size="sm" onClick={() => setEditing(true)}>{t('common.edit')}</Button>}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create subscription dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isAr ? 'إنشاء اشتراك جديد' : 'Create New Subscription'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t('subscriptions.student')}</Label>
              <Input placeholder={isAr ? 'بحث عن طالب...' : 'Search student...'} value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="mb-1" />
              <Select value={createForm.student_id} onValueChange={(v) => setCreateForm({ ...createForm, student_id: v })}>
                <SelectTrigger><SelectValue placeholder={isAr ? 'اختر طالب' : 'Select student'} /></SelectTrigger>
                <SelectContent>
                  {filteredStudents.slice(0, 20).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.profiles?.full_name || s.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('subscriptions.course')}</Label>
              <Input placeholder={isAr ? 'بحث عن دورة...' : 'Search course...'} value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} className="mb-1" />
              <Select value={createForm.course_id} onValueChange={(v) => setCreateForm({ ...createForm, course_id: v })}>
                <SelectTrigger><SelectValue placeholder={isAr ? 'اختر دورة' : 'Select course'} /></SelectTrigger>
                <SelectContent>
                  {filteredCourses.slice(0, 20).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('subscriptions.teacher')}</Label>
              <Input placeholder={isAr ? 'بحث عن معلم...' : 'Search teacher...'} value={teacherSearch} onChange={(e) => setTeacherSearch(e.target.value)} className="mb-1" />
              <Select value={createForm.teacher_id} onValueChange={(v) => setCreateForm({ ...createForm, teacher_id: v })}>
                <SelectTrigger><SelectValue placeholder={isAr ? 'اختر معلم (اختياري)' : 'Select teacher (optional)'} /></SelectTrigger>
                <SelectContent>
                  {filteredTeachers.slice(0, 20).map((te) => (
                    <SelectItem key={te.id} value={te.id}>{te.profiles?.full_name || te.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('subscriptions.type')}</Label>
              <Select value={createForm.subscription_type} onValueChange={(v) => setCreateForm({ ...createForm, subscription_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{isAr ? 'شهري' : 'Monthly'}</SelectItem>
                  <SelectItem value="yearly">{isAr ? 'سنوي' : 'Yearly'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{isAr ? 'الدروس الأسبوعية' : 'Weekly Lessons'}</Label><Input type="number" min="1" value={createForm.weekly_lessons} onChange={(e) => setCreateForm({ ...createForm, weekly_lessons: e.target.value })} /></div>
              <div><Label>{isAr ? 'مدة الدرس (دقيقة)' : 'Lesson Duration (min)'}</Label><Input type="number" min="15" step="15" value={createForm.lesson_duration} onChange={(e) => setCreateForm({ ...createForm, lesson_duration: e.target.value })} /></div>
            </div>
            <div><Label>{isAr ? 'السعر' : 'Price'} ({currency.symbol})</Label><Input type="number" value={createForm.price} onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })} /></div>
            <div><Label>{t('subscriptions.startDate')}</Label><Input type="date" value={createForm.start_date} onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })} /></div>
            <div><Label>{t('subscriptions.renewalDate')} ({isAr ? 'محسوب تلقائياً' : 'auto-calculated'})</Label><Input type="date" value={createForm.renewal_date} readOnly className="bg-muted" /></div>
            <Button onClick={handleCreate} disabled={createLoading} className="w-full">
              {createLoading ? t('common.loading') : (isAr ? 'إنشاء الاشتراك' : 'Create Subscription')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subscriptions;
