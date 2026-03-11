import { useState, useEffect, useMemo } from 'react';
import { usePagination } from '@/hooks/use-pagination';
import PaginationControls from '@/components/PaginationControls';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Eye, Edit, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { useNavigate } from 'react-router-dom';
import { courseStatusLabels, getLabel } from '@/lib/statusLabels';
import { TableSkeleton } from '@/components/PageSkeleton';

const Courses = () => {
  const { t, language } = useLanguage();
  const { role } = useAuth();
  const navigate = useNavigate();
  const isAr = language === 'ar';
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [form, setForm] = useState({ title: '', title_ar: '', description: '', description_ar: '', status: 'draft', image_url: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const canEdit = role === 'admin' || role === 'teacher';

  const fetchCourses = async () => {
    setLoading(true);
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    setCourses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleImageUpload = async (): Promise<string> => {
    if (!imageFile) return form.image_url;
    setUploading(true);
    const ext = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('course-images').upload(fileName, imageFile);
    setUploading(false);
    if (error) { notifyError({ error, isAr, rawMessage: error.message }); return form.image_url; }
    const { data: urlData } = supabase.storage.from('course-images').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    const imageUrl = await handleImageUpload();
    const saveData = { ...form, image_url: imageUrl };
    if (editCourse) {
      await supabase.from('courses').update(saveData).eq('id', editCourse.id);
      toast.success(isAr ? 'تم تحديث الدورة' : 'Course updated');
    } else {
      await supabase.from('courses').insert(saveData);
      toast.success(isAr ? 'تم إنشاء الدورة' : 'Course created');
    }
    setDialogOpen(false);
    setEditCourse(null);
    setForm({ title: '', title_ar: '', description: '', description_ar: '', status: 'draft', image_url: '' });
    setImageFile(null);
    fetchCourses();
  };

  const openEdit = (course: any) => {
    setEditCourse(course);
    setForm({ title: course.title, title_ar: course.title_ar || '', description: course.description || '', description_ar: course.description_ar || '', status: course.status, image_url: course.image_url || '' });
    setImageFile(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('courses').delete().eq('id', deleteTarget);
    toast.success(isAr ? 'تم حذف الدورة' : 'Course deleted');
    setDeleteTarget(null);
    fetchCourses();
  };

  const statusCounts = {
    all: courses.length,
    draft: courses.filter(c => c.status === 'draft').length,
    published: courses.filter(c => c.status === 'published').length,
    archived: courses.filter(c => c.status === 'archived').length,
  };

  const filtered = useMemo(() => {
    let result = courses.filter((c) => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || (c.title_ar || '').includes(search);
      return matchesStatus && matchesSearch;
    });
    return result;
  }, [courses, statusFilter, search]);

  const statusColor: Record<string, string> = { draft: 'secondary', published: 'default', archived: 'outline' };

  const { currentPage, totalPages, paginatedItems, setCurrentPage, totalItems, startIndex, endIndex } = usePagination(filtered);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold shrink-0">{t('courses.title')}</h1>
        <div className="flex items-center gap-2 ms-auto">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 w-48 sm:w-64" />
          </div>
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditCourse(null); setForm({ title: '', title_ar: '', description: '', description_ar: '', status: 'draft', image_url: '' }); setImageFile(null); } }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 me-2" />{t('courses.create')}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>{editCourse ? t('courses.edit') : t('courses.create')}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>{t('courses.name')} (EN)</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                    <div><Label>{t('courses.name')} (AR)</Label><Input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} dir="rtl" className="text-right" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>{t('courses.description')} (EN)</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                    <div><Label>{t('courses.description')} (AR)</Label><Textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} dir="rtl" className="text-right" /></div>
                  </div>
                  <div>
                    <Label>{isAr ? 'صورة الدورة' : 'Course Image'}</Label>
                    {(form.image_url || imageFile) && (
                      <img src={imageFile ? URL.createObjectURL(imageFile) : form.image_url} alt="Preview" className="h-24 w-full object-cover rounded-lg mt-1 mb-2" />
                    )}
                    <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                  </div>
                  <div>
                    <Label>{t('courses.status')}</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">{t('courses.draft')}</SelectItem>
                        <SelectItem value="published">{t('courses.published')}</SelectItem>
                        <SelectItem value="archived">{t('courses.archived')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSave} className="w-full" disabled={uploading}>
                    {uploading ? (isAr ? 'جاري الرفع...' : 'Uploading...') : t('common.save')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Status Filters */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          {Object.entries(statusCounts).map(([key, count]) => (
            <TabsTrigger key={key} value={key} className="text-xs gap-1.5">
              {key === 'all' ? (isAr ? 'الكل' : 'All') : getLabel(courseStatusLabels, key, isAr)}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-[18px]">{count}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('courses.name')}</TableHead>
              <TableHead>{t('courses.status')}</TableHead>
              <TableHead>{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {course.image_url && <img src={course.image_url} alt="" className="h-8 w-8 rounded object-cover" />}
                    {language === 'ar' && course.title_ar ? course.title_ar : course.title}
                  </div>
                </TableCell>
                <TableCell><Badge variant={statusColor[course.status] as any}>{getLabel(courseStatusLabels, course.status, isAr)}</Badge></TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted h-8 w-8" onClick={() => navigate(`/dashboard/courses/${course.id}`)}><Eye className="h-3.5 w-3.5" /></Button>
                  {canEdit && <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted h-8 w-8" onClick={() => openEdit(course)}><Edit className="h-3.5 w-3.5" /></Button>}
                  {role === 'admin' && <Button variant="ghost" size="icon" className="rounded-full hover:bg-destructive/10 text-destructive hover:text-destructive h-8 w-8" onClick={() => setDeleteTarget(course.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'حذف الدورة' : 'Delete Course'}</AlertDialogTitle>
            <AlertDialogDescription>{isAr ? 'هل أنت متأكد؟ لا يمكن التراجع.' : 'Are you sure? This cannot be undone.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>{isAr ? 'حذف' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Courses;
