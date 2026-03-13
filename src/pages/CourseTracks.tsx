import { useState } from 'react';
import { ACTION_BTN, ACTION_BTN_DESTRUCTIVE, ACTION_ICON } from '@/lib/actionBtnClass';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Route, Plus, Pencil, Trash2, Search, ChevronDown, BookOpen, GripVertical, Layers, Hash } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import SortableList from '@/components/course/SortableList';
import SortableItem from '@/components/course/SortableItem';
import { cn } from '@/lib/utils';
import { logAction } from '@/lib/actionsQueue';
import { ActionButton } from '@/components/ui/action-button';

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
      const action = editing ? 'modify' : 'add';
      logAction(action as any, 'Course Track', `${action === 'add' ? 'Created' : 'Updated'} track: ${form.title}`, editing?.id);
      toast.success(isAr ? 'تم الحفظ' : 'Saved successfully');
      closeDialog();
    },
    onError: () => toast.error(isAr ? 'حدث خطأ' : 'An error occurred'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const track = tracks.find(t => t.id === id);
      const { error } = await supabase.from('course_tracks').delete().eq('id', id);
      if (error) throw error;
      logAction('delete', 'Course Track', `Deleted track: ${track?.title || id}`, id);
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
    for (const level of levels) {
      const levelCourses = trackCourses.filter(c => c.level_id === level.id);
      if (levelCourses.length > 0) groups.push({ level, courses: levelCourses });
    }
    const uncategorized = trackCourses.filter(c => !c.level_id);
    if (uncategorized.length > 0) groups.push({ level: null, courses: uncategorized });
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
    logAction('modify', 'Course Order', `Reordered courses in track`, trackId);
  };

  const handleChangeCourseLevel = (courseId: string, newLevelId: string) => {
    const value = newLevelId === '__none__' ? null : newLevelId;
    updateCourseMutation.mutate([{ id: courseId, level_id: value }]);
    logAction('modify', 'Course Level', `Changed course level`, courseId);
    toast.success(isAr ? 'تم تحديث المستوى' : 'Level updated');
  };

  const filtered = tracks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.title_ar?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'المسارات التعليمية' : 'Course Tracks'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'تنظيم الدورات في مسارات تعليمية مع مستويات متعددة' : 'Organize courses into learning tracks with multiple levels'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 w-56" />
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 me-2" />{isAr ? 'إضافة مسار' : 'Add Track'}
          </Button>
        </div>
      </div>

      {/* Stats row */}
      {!isLoading && tracks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Route className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? 'المسارات' : 'Tracks'}</p>
                <p className="text-lg font-bold">{tracks.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? 'دورات مرتبطة' : 'Linked Courses'}</p>
                <p className="text-lg font-bold">{courses.filter(c => c.track_id).length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Layers className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? 'المستويات' : 'Levels'}</p>
                <p className="text-lg font-bold">{levels.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <Hash className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? 'بدون مسار' : 'Unassigned'}</p>
                <p className="text-lg font-bold">{courses.filter(c => !c.track_id).length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Track List */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Route} title={isAr ? 'لم يتم إنشاء أي مسارات بعد' : 'No tracks yet'} description={isAr ? 'أنشئ مساراً تعليمياً لتنظيم الدورات' : 'Create a track to organize courses'} actionLabel={isAr ? 'إضافة مسار' : 'Add Track'} onAction={openNew} />
      ) : (
        <div className="space-y-4">
          {filtered.map((t, idx) => {
            const trackCourses = getTrackCourses(t.id);
            const isExpanded = expandedTracks.has(t.id);
            const grouped = getGroupedCourses(t.id);

            return (
              <Card key={t.id} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleTrack(t.id)}>
                  <CardHeader className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      {/* Track number badge */}
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{idx + 1}</span>
                      </div>
                      
                      <CollapsibleTrigger className="flex items-center gap-3 flex-1 text-start group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base">{isAr ? (t.title_ar || t.title) : t.title}</h3>
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              {trackCourses.length} {isAr ? 'دورة' : 'courses'}
                            </Badge>
                          </div>
                          {(isAr ? (t.description_ar || t.description) : t.description) && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                              {isAr ? (t.description_ar || t.description) : t.description}
                            </p>
                          )}
                        </div>
                        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ms-auto', isExpanded && 'rotate-180')} />
                      </CollapsibleTrigger>

                      <Separator orientation="vertical" className="h-8 mx-1" />

                      <div className="flex gap-1 shrink-0">
                        <ActionButton icon={Pencil} label={isAr ? 'تعديل' : 'Edit'} onClick={() => openEdit(t)} />
                        <ActionButton icon={Trash2} label={isAr ? 'حذف' : 'Delete'} destructive onClick={() => setDeleteId(t.id)} />
                      </div>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <Separator />
                    <CardContent className="py-4 px-5">
                      {trackCourses.length === 0 ? (
                        <div className="text-center py-8 border border-dashed rounded-xl bg-muted/30">
                          <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                          <p className="text-sm text-muted-foreground">{isAr ? 'لا توجد دورات مرتبطة بهذا المسار' : 'No courses assigned to this track'}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">{isAr ? 'اربط الدورات من صفحة إدارة الدورات' : 'Link courses from the course management page'}</p>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {grouped.map(group => {
                            const levelKey = group.level?.id || '__none__';
                            const levelTitle = group.level
                              ? (isAr ? (group.level.title_ar || group.level.title) : group.level.title)
                              : (isAr ? 'بدون مستوى' : 'No Level');

                            return (
                              <div key={levelKey} className="space-y-2">
                                <div className="flex items-center gap-2 px-1">
                                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{levelTitle}</h4>
                                  <Badge variant="outline" className="text-[9px] h-4 px-1.5">{group.courses.length}</Badge>
                                </div>
                                <div className="border rounded-xl overflow-hidden bg-card">
                                  <SortableList
                                    items={group.courses}
                                    onReorder={(activeId, overId) => handleReorder(t.id, group.level?.id || null, activeId, overId)}
                                  >
                                    {group.courses.map((course, ci) => (
                                      <SortableItem key={course.id} id={course.id}>
                                        <div className={cn(
                                          "flex items-center justify-between gap-3 py-2.5 pe-3",
                                          ci < group.courses.length - 1 && "border-b border-border/50"
                                        )}>
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="text-sm font-medium truncate">{isAr ? (course.title_ar || course.title) : course.title}</span>
                                            <Badge
                                              variant={course.status === 'published' ? 'default' : 'outline'}
                                              className={cn(
                                                "text-[10px] shrink-0",
                                                course.status === 'published' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                              )}
                                            >
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
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? (isAr ? 'تعديل المسار' : 'Edit Track') : (isAr ? 'إضافة مسار جديد' : 'Create New Track')}</DialogTitle>
            <DialogDescription>
              {isAr ? 'أدخل تفاصيل المسار التعليمي باللغتين' : 'Enter track details in both languages'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary" />
                {isAr ? 'العنوان' : 'Title'}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? 'الإنجليزية' : 'English'}</Label>
                  <Input placeholder="e.g. Quran Memorization" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? 'العربية' : 'Arabic'}</Label>
                  <Input dir="rtl" placeholder="مثال: تحفيظ القرآن" value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} />
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary" />
                {isAr ? 'الوصف' : 'Description'}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? 'الإنجليزية' : 'English'}</Label>
                  <Textarea rows={3} placeholder="Brief description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? 'العربية' : 'Arabic'}</Label>
                  <Textarea dir="rtl" rows={3} placeholder="وصف مختصر..." value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeDialog}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.title.trim() || saveMutation.isPending}>
              {saveMutation.isPending ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : (isAr ? 'حفظ' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'تأكيد الحذف' : 'Confirm Delete'}</AlertDialogTitle>
            <AlertDialogDescription>{isAr ? 'هل أنت متأكد من حذف هذا المسار؟ لن يتم حذف الدورات المرتبطة.' : 'Are you sure you want to delete this track? Linked courses will not be deleted.'}</AlertDialogDescription>
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
