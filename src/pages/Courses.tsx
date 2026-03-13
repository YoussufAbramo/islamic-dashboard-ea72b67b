import { useState, useEffect, useMemo } from 'react';
import { ACTION_BTN, ACTION_BTN_DESTRUCTIVE, ACTION_ICON } from '@/lib/actionBtnClass';
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
import { Plus, Search, Edit, Settings, Trash2, LayoutGrid, List, BookOpen } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import ImagePickerField from '@/components/media/ImagePickerField';
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
  const [form, setForm] = useState({ title: '', title_ar: '', description: '', description_ar: '', status: 'draft', image_url: '', category_id: '', level_id: '', track_id: '', duration_weeks: '' });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => (localStorage.getItem('courses_view') as any) || 'list');

  // Dynamic lookups
  const [categories, setCategories] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);

  const canEdit = role === 'admin' || role === 'teacher';

  const toggleView = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('courses_view', mode);
  };

  const fetchLookups = async () => {
    const [catRes, lvlRes, trkRes] = await Promise.all([
      supabase.from('course_categories').select('*').order('sort_order'),
      supabase.from('course_levels').select('*').order('sort_order'),
      supabase.from('course_tracks').select('*').order('sort_order'),
    ]);
    setCategories(catRes.data || []);
    setLevels(lvlRes.data || []);
    setTracks(trkRes.data || []);
  };

  const fetchCourses = async () => {
    setLoading(true);
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    setCourses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); fetchLookups(); }, []);

  const getCategoryLabel = (course: any) => {
    const cat = categories.find(c => c.id === course.category_id);
    if (cat) return isAr && cat.title_ar ? cat.title_ar : cat.title;
    return course.category || null;
  };

  const getLevelLabel = (course: any) => {
    const lvl = levels.find(l => l.id === course.level_id);
    if (lvl) return isAr && lvl.title_ar ? lvl.title_ar : lvl.title;
    return course.skill_level || null;
  };

  const getTrackLabel = (course: any) => {
    const trk = tracks.find(t => t.id === course.track_id);
    if (trk) return isAr && trk.title_ar ? trk.title_ar : trk.title;
    return null;
  };

  const handleSave = async () => {
    const saveData: any = {
      title: form.title,
      title_ar: form.title_ar,
      description: form.description,
      description_ar: form.description_ar,
      status: form.status,
      image_url: form.image_url,
      category_id: form.category_id || null,
      level_id: form.level_id || null,
      track_id: form.track_id || null,
      duration_weeks: form.duration_weeks ? parseInt(form.duration_weeks) : null,
    };
    if (editCourse) {
      await supabase.from('courses').update(saveData).eq('id', editCourse.id);
      toast.success(isAr ? 'تم تحديث الدورة' : 'Course updated');
    } else {
      await supabase.from('courses').insert(saveData);
      toast.success(isAr ? 'تم إنشاء الدورة' : 'Course created');
    }
    setDialogOpen(false);
    setEditCourse(null);
    resetForm();
    fetchCourses();
  };

  const resetForm = () => setForm({ title: '', title_ar: '', description: '', description_ar: '', status: 'draft', image_url: '', category_id: '', level_id: '', track_id: '', duration_weeks: '' });

  const openEdit = (course: any) => {
    setEditCourse(course);
    setForm({
      title: course.title,
      title_ar: course.title_ar || '',
      description: course.description || '',
      description_ar: course.description_ar || '',
      status: course.status,
      image_url: course.image_url || '',
      category_id: course.category_id || '',
      level_id: course.level_id || '',
      track_id: course.track_id || '',
      duration_weeks: course.duration_weeks?.toString() || '',
    });
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
    return courses.filter((c) => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || (c.title_ar || '').includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [courses, statusFilter, search]);

  const statusColor: Record<string, string> = { draft: 'secondary', published: 'default', archived: 'outline' };

  const { currentPage, totalPages, paginatedItems, setCurrentPage, totalItems, startIndex, endIndex } = usePagination(filtered);

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold shrink-0">{t('courses.title')}</h1>
        <div className="flex items-center gap-2 ms-auto">
          {/* View toggle */}
          <div className="flex items-center border rounded-md">
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-none rounded-s-md" onClick={() => toggleView('list')}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-none rounded-e-md" onClick={() => toggleView('grid')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 w-48 sm:w-64" />
          </div>
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditCourse(null); resetForm(); } }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 me-2" />{t('courses.create')}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>{isAr ? 'التصنيف' : 'Category'}</Label>
                      <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                        <SelectTrigger><SelectValue placeholder={isAr ? 'اختر التصنيف' : 'Select category'} /></SelectTrigger>
                        <SelectContent>
                          {categories.map(c => <SelectItem key={c.id} value={c.id}>{isAr && c.title_ar ? c.title_ar : c.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{isAr ? 'المستوى' : 'Level'}</Label>
                      <Select value={form.level_id} onValueChange={(v) => setForm({ ...form, level_id: v })}>
                        <SelectTrigger><SelectValue placeholder={isAr ? 'اختر المستوى' : 'Select level'} /></SelectTrigger>
                        <SelectContent>
                          {levels.map(l => <SelectItem key={l.id} value={l.id}>{isAr && l.title_ar ? l.title_ar : l.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{isAr ? 'المسار' : 'Track'}</Label>
                      <Select value={form.track_id} onValueChange={(v) => setForm({ ...form, track_id: v })}>
                        <SelectTrigger><SelectValue placeholder={isAr ? 'اختر المسار' : 'Select track'} /></SelectTrigger>
                        <SelectContent>
                          {tracks.map(tr => <SelectItem key={tr.id} value={tr.id}>{isAr && tr.title_ar ? tr.title_ar : tr.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{isAr ? 'المدة (أسابيع)' : 'Duration (weeks)'}</Label>
                      <Input type="number" min={1} value={form.duration_weeks} onChange={(e) => setForm({ ...form, duration_weeks: e.target.value })} placeholder={isAr ? 'مثال: 8' : 'e.g. 8'} />
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
                  </div>
                  <ImagePickerField
                    label={isAr ? 'صورة الدورة' : 'Course Image'}
                    value={form.image_url}
                    onChange={(url) => setForm({ ...form, image_url: url })}
                  />
                  <Button onClick={handleSave} className="w-full">
                    {t('common.save')}
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

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedItems.map((course) => (
            <Card key={course.id} className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/dashboard/courses/${course.id}`)}>
              <div className="aspect-video bg-muted relative overflow-hidden">
                {course.image_url ? (
                  <img src={course.image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-muted-foreground/30">{course.title?.charAt(0)}</span>
                  </div>
                )}
                <Badge variant={statusColor[course.status] as any} className="absolute top-2 end-2 text-[10px]">
                  {getLabel(courseStatusLabels, course.status, isAr)}
                </Badge>
              </div>
              <CardContent className="p-3 space-y-1.5">
                <h3 className="font-semibold text-sm truncate">{isAr && course.title_ar ? course.title_ar : course.title}</h3>
                {course.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{isAr && course.description_ar ? course.description_ar : course.description}</p>
                )}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {getCategoryLabel(course) && (
                    <Badge variant="outline" className="text-[10px]">{getCategoryLabel(course)}</Badge>
                  )}
                  {getLevelLabel(course) && (
                    <Badge variant="outline" className="text-[10px]">{getLevelLabel(course)}</Badge>
                  )}
                  {getTrackLabel(course) && (
                    <Badge variant="outline" className="text-[10px]">{getTrackLabel(course)}</Badge>
                  )}
                  {course.duration_weeks && (
                    <Badge variant="outline" className="text-[10px] gap-0.5">
                      {course.duration_weeks} {isAr ? 'أسابيع' : 'weeks'}
                    </Badge>
                  )}
                </div>
                {canEdit && (
                  <div className="flex gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(course)}><Edit className="h-3 w-3" /></Button>
                    {role === 'admin' && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(course.id)}><Trash2 className="h-3 w-3" /></Button>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={BookOpen}
                title={isAr ? 'لا توجد دورات' : 'No courses found'}
                description={isAr ? 'أنشئ دورة جديدة للبدء' : 'Create a new course to get started'}
              />
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('courses.name')}</TableHead>
                <TableHead>{isAr ? 'التصنيف' : 'Category'}</TableHead>
                <TableHead>{isAr ? 'المسار' : 'Track'}</TableHead>
                <TableHead>{isAr ? 'المدة' : 'Duration'}</TableHead>
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
                  <TableCell>
                    {getCategoryLabel(course) ? (
                      <Badge variant="outline" className="text-xs">{getCategoryLabel(course)}</Badge>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {getTrackLabel(course) || '—'}
                  </TableCell>
                  <TableCell>
                    {course.duration_weeks ? `${course.duration_weeks} ${isAr ? 'أسابيع' : 'weeks'}` : '—'}
                  </TableCell>
                  <TableCell><Badge variant={statusColor[course.status] as any}>{getLabel(courseStatusLabels, course.status, isAr)}</Badge></TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" className={ACTION_BTN} onClick={() => navigate(`/dashboard/courses/${course.id}`)}><Eye className={ACTION_ICON} /></Button>
                    {canEdit && <Button variant="ghost" size="icon" className={ACTION_BTN} onClick={() => openEdit(course)}><Edit className={ACTION_ICON} /></Button>}
                    {role === 'admin' && <Button variant="ghost" size="icon" className={ACTION_BTN_DESTRUCTIVE} onClick={() => setDeleteTarget(course.id)}><Trash2 className={ACTION_ICON} /></Button>}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

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
