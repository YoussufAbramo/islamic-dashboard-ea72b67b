import { useState } from 'react';
import { ACTION_BTN, ACTION_BTN_DESTRUCTIVE, ACTION_ICON } from '@/lib/actionBtnClass';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Route, Plus, Pencil, Trash2, Search, ChevronDown, BookOpen, GripVertical } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SortableList from '@/components/course/SortableList';
import SortableItem from '@/components/course/SortableItem';
import { cn } from '@/lib/utils';

interface Track {
  id: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  sort_order: number;
  created_at: string;
}

interface Level {
  id: string;
  title: string;
  title_ar: string;
  sort_order: number;
}

interface Course {
  id: string;
  title: string;
  title_ar: string | null;
  track_id: string | null;
  level_id: string | null;
  track_sort_order: number;
  status: string;
}

const CourseTracks = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Track | null>(null);
  const [form, setForm] = useState({ title: '', title_ar: '', description: '', description_ar: '' });
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(new Set());

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ['course_tracks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('course_tracks').select('*').order('sort_order');
      if (error) throw error;
      return data as Track[];
    },
  });

  const { data: levels = [] } = useQuery({
    queryKey: ['course_levels'],
    queryFn: async () => {
      const { data, error } = await supabase.from('course_levels').select('*').order('sort_order');
      if (error) throw error;
      return data as Level[];
    },
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses_for_tracks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, title_ar, track_id, level_id, track_sort_order, status')
        .order('track_sort_order');
      if (error) throw error;
      return data as Course[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from('course_tracks').update(form).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('course_tracks').insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course_tracks'] });
      toast.success(isAr ? 'تم الحفظ' : 'Saved successfully');
      closeDialog();
    },
    onError: () => toast.error(isAr ? 'حدث خطأ' : 'An error occurred'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('course_tracks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course_tracks'] });
      toast.success(isAr ? 'تم الحذف' : 'Deleted');
      setDeleteId(null);
    },
    onError: () => toast.error(isAr ? 'حدث خطأ' : 'An error occurred'),
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (updates: { id: string; level_id?: string | null; track_sort_order?: number }[]) => {
      for (const u of updates) {
        const { id, ...rest } = u;
        const { error } = await supabase.from('courses').update(rest).eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses_for_tracks'] });
    },
    onError: () => toast.error(isAr ? 'حدث خطأ' : 'An error occurred'),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', title_ar: '', description: '', description_ar: '' });
    setDialogOpen(true);
  };

  const openEdit = (t: Track) => {
    setEditing(t);
    setForm({ title: t.title, title_ar: t.title_ar, description: t.description, description_ar: t.description_ar });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const toggleTrack = (id: string) => {
    setExpandedTracks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getTrackCourses = (trackId: string) =>
    courses.filter(c => c.track_id === trackId).sort((a, b) => a.track_sort_order - b.track_sort_order);

  const getGroupedCourses = (trackId: string) => {
    const trackCourses = getTrackCourses(trackId);
    const groups: { level: Level | null; courses: Course[] }[] = [];

    // Group by levels in sort order
    for (const level of levels) {
      const levelCourses = trackCourses.filter(c => c.level_id === level.id);
      if (levelCourses.length > 0) {
        groups.push({ level, courses: levelCourses });
      }
    }

    // Uncategorized courses (no level)
    const uncategorized = trackCourses.filter(c => !c.level_id);
    if (uncategorized.length > 0) {
      groups.push({ level: null, courses: uncategorized });
    }

    return groups;
  };

  const handleReorder = (trackId: string, levelId: string | null, activeId: string, overId: string) => {
    const trackCourses = getTrackCourses(trackId);
    const levelCourses = trackCourses.filter(c => (c.level_id || '__none__') === (levelId || '__none__'));

    const oldIndex = levelCourses.findIndex(c => c.id === activeId);
    const newIndex = levelCourses.findIndex(c => c.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...levelCourses];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const updates = reordered.map((c, i) => ({ id: c.id, track_sort_order: i }));
    updateCourseMutation.mutate(updates);
  };

  const handleChangeCourseLevel = (courseId: string, newLevelId: string) => {
    const value = newLevelId === '__none__' ? null : newLevelId;
    updateCourseMutation.mutate([{ id: courseId, level_id: value }]);
    toast.success(isAr ? 'تم تحديث المستوى' : 'Level updated');
  };

  const filtered = tracks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.title_ar?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">{isAr ? 'المسارات التعليمية' : 'Course Tracks'}</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 w-56" />
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 me-2" />{isAr ? 'إضافة مسار' : 'Add Track'}</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Route} title={isAr ? 'لم يتم إنشاء أي مسارات بعد' : 'No tracks yet'} description={isAr ? 'أنشئ مساراً تعليمياً لتنظيم الدورات' : 'Create a track to organize courses'} actionLabel={isAr ? 'إضافة مسار' : 'Add Track'} onAction={openNew} />
      ) : (
        <div className="space-y-3">
          {filtered.map(t => {
            const trackCourses = getTrackCourses(t.id);
            const isExpanded = expandedTracks.has(t.id);
            const grouped = getGroupedCourses(t.id);

            return (
              <Card key={t.id}>
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Collapsible open={isExpanded} onOpenChange={() => toggleTrack(t.id)} className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <CollapsibleTrigger className="flex items-center gap-2 text-start flex-1 group">
                          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0', isExpanded && 'rotate-180')} />
                          <div>
                            <h3 className="font-semibold">{isAr ? (t.title_ar || t.title) : t.title}</h3>
                            {(isAr ? (t.description_ar || t.description) : t.description) && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{isAr ? (t.description_ar || t.description) : t.description}</p>
                            )}
                          </div>
                          <Badge variant="secondary" className="ms-auto shrink-0">{trackCourses.length} {isAr ? 'دورة' : 'courses'}</Badge>
                        </CollapsibleTrigger>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className={ACTION_BTN} onClick={() => openEdit(t)}><Pencil className={ACTION_ICON} /></Button>
                          <Button variant="ghost" size="icon" className={ACTION_BTN_DESTRUCTIVE} onClick={() => setDeleteId(t.id)}><Trash2 className={ACTION_ICON} /></Button>
                        </div>
                      </div>

                      <CollapsibleContent className="mt-3">
                        {trackCourses.length === 0 ? (
                          <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                            <BookOpen className="h-5 w-5 mx-auto mb-1 opacity-50" />
                            {isAr ? 'لا توجد دورات مرتبطة بهذا المسار' : 'No courses assigned to this track'}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {grouped.map(group => {
                              const levelKey = group.level?.id || '__none__';
                              const levelTitle = group.level
                                ? (isAr ? (group.level.title_ar || group.level.title) : group.level.title)
                                : (isAr ? 'بدون مستوى' : 'No Level');

                              return (
                                <div key={levelKey} className="space-y-1.5">
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                                    {levelTitle}
                                  </h4>
                                  <div className="border rounded-lg divide-y bg-card">
                                    <SortableList
                                      items={group.courses}
                                      onReorder={(activeId, overId) => handleReorder(t.id, group.level?.id || null, activeId, overId)}
                                    >
                                      {group.courses.map(course => (
                                        <SortableItem key={course.id} id={course.id}>
                                          <div className="flex items-center justify-between gap-2 py-2 pe-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <span className="text-sm truncate">{isAr ? (course.title_ar || course.title) : course.title}</span>
                                              <Badge variant={course.status === 'published' ? 'default' : 'outline'} className="text-[10px] shrink-0">
                                                {course.status === 'published' ? (isAr ? 'منشور' : 'Published') : (isAr ? 'مسودة' : 'Draft')}
                                              </Badge>
                                            </div>
                                            <Select
                                              value={course.level_id || '__none__'}
                                              onValueChange={val => handleChangeCourseLevel(course.id, val)}
                                            >
                                              <SelectTrigger className="w-32 h-7 text-xs shrink-0">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="__none__">{isAr ? 'بدون مستوى' : 'No Level'}</SelectItem>
                                                {levels.map(l => (
                                                  <SelectItem key={l.id} value={l.id}>
                                                    {isAr ? (l.title_ar || l.title) : l.title}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </SortableItem>
                                      ))}
                                    </SortableList>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? (isAr ? 'تعديل المسار' : 'Edit Track') : (isAr ? 'إضافة مسار' : 'Add Track')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{isAr ? 'العنوان (EN)' : 'Title (EN)'}</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>{isAr ? 'العنوان (AR)' : 'Title (AR)'}</Label><Input dir="rtl" value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{isAr ? 'الوصف (EN)' : 'Description (EN)'}</Label><Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="space-y-2"><Label>{isAr ? 'الوصف (AR)' : 'Description (AR)'}</Label><Textarea dir="rtl" rows={3} value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.title.trim() || saveMutation.isPending}>{isAr ? 'حفظ' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'تأكيد الحذف' : 'Confirm Delete'}</AlertDialogTitle>
            <AlertDialogDescription>{isAr ? 'هل أنت متأكد من حذف هذا المسار؟' : 'Are you sure you want to delete this track?'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>{isAr ? 'حذف' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseTracks;
