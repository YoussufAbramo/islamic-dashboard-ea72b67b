import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { format, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, addWeeks, eachDayOfInterval, isToday, isSameMonth } from 'date-fns';
import { List, CalendarDays, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { usePagination } from '@/hooks/use-pagination';
import PaginationControls from '@/components/PaginationControls';
import { timetableStatusLabels, getLabel } from '@/lib/statusLabels';
import { toast } from 'sonner';

type SortOrder = 'newest' | 'oldest';

const Timetable = () => {
  const { t, language } = useLanguage();
  const { role } = useAuth();
  const isAr = language === 'ar';
  const isAdmin = role === 'admin';
  const [entries, setEntries] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarMode, setCalendarMode] = useState<'monthly' | 'weekly'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('timetable_entries')
      .select('*, courses:course_id(title), students:student_id(user_id, profiles:students_user_id_profiles_fkey(full_name)), teachers_rel:teacher_id(user_id, profiles:teachers_user_id_profiles_fkey(full_name))')
      .order('scheduled_at', { ascending: true });
    setEntries(data || []);
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('timetable_entries').delete().eq('id', deleteTarget);
    toast.success(isAr ? 'تم حذف الموعد' : 'Entry deleted');
    setDeleteTarget(null);
    fetchEntries();
  };

  const statusCounts = {
    all: entries.length,
    scheduled: entries.filter(e => e.status === 'scheduled').length,
    completed: entries.filter(e => e.status === 'completed').length,
    cancelled: entries.filter(e => e.status === 'cancelled').length,
  };

  const statusTabs = [
    { value: 'all', label: isAr ? 'الكل' : 'All' },
    { value: 'scheduled', label: getLabel(timetableStatusLabels, 'scheduled', isAr) },
    { value: 'completed', label: getLabel(timetableStatusLabels, 'completed', isAr) },
    { value: 'cancelled', label: getLabel(timetableStatusLabels, 'cancelled', isAr) },
  ];

  const filteredEntries = useMemo(() => {
    let result = entries.filter(e => statusFilter === 'all' || e.status === statusFilter);
    result.sort((a, b) => {
      const da = new Date(a.scheduled_at).getTime();
      const db = new Date(b.scheduled_at).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return result;
  }, [entries, sortOrder, statusFilter]);

  const now = new Date().toISOString();
  const upcoming = filteredEntries.filter((e) => e.scheduled_at >= now);
  const past = filteredEntries.filter((e) => e.scheduled_at < now);

  const statusColors: Record<string, string> = { scheduled: 'default', completed: 'secondary', cancelled: 'destructive' };

  const { currentPage: upPage, totalPages: upTotal, paginatedItems: upItems, setCurrentPage: setUpPage, totalItems: upCount, startIndex: upStart, endIndex: upEnd } = usePagination(upcoming);
  const { currentPage: pastPage, totalPages: pastTotal, paginatedItems: pastItems, setCurrentPage: setPastPage, totalItems: pastCount, startIndex: pastStart, endIndex: pastEnd } = usePagination(past);

  const SortButton = () => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
      className="gap-1"
    >
      {sortOrder === 'newest' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
      {sortOrder === 'newest' ? (isAr ? 'الأحدث' : 'Newest') : (isAr ? 'الأقدم' : 'Oldest')}
    </Button>
  );

  const renderTable = (items: any[]) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('timetable.date')}</TableHead>
            <TableHead>{t('timetable.time')}</TableHead>
            <TableHead>{t('timetable.course')}</TableHead>
            <TableHead>{t('timetable.teacher')}</TableHead>
            <TableHead>{t('timetable.student')}</TableHead>
            <TableHead>{t('timetable.duration')}</TableHead>
            <TableHead>{t('timetable.status')}</TableHead>
            {isAdmin && <TableHead>{t('common.actions')}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{format(new Date(entry.scheduled_at), 'yyyy-MM-dd')}</TableCell>
              <TableCell>{format(new Date(entry.scheduled_at), 'HH:mm')}</TableCell>
              <TableCell>{entry.courses?.title || '-'}</TableCell>
              <TableCell>{entry.teachers_rel?.profiles?.full_name || '-'}</TableCell>
              <TableCell>{entry.students?.profiles?.full_name || '-'}</TableCell>
              <TableCell>{entry.duration_minutes} {t('common.minutes')}</TableCell>
              <TableCell><Badge variant={statusColors[entry.status] as any}>{getLabel(timetableStatusLabels, entry.status, isAr)}</Badge></TableCell>
              {isAdmin && (
                <TableCell>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(entry.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
          {items.length === 0 && <TableRow><TableCell colSpan={isAdmin ? 8 : 7} className="text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );

  // Calendar logic
  const calendarDays = useMemo(() => {
    if (calendarMode === 'monthly') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: calStart, end: calEnd });
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentDate, calendarMode]);

  const navigate = (dir: 'prev' | 'next') => {
    if (calendarMode === 'monthly') {
      setCurrentDate(prev => addMonths(prev, dir === 'next' ? 1 : -1));
    } else {
      setCurrentDate(prev => addWeeks(prev, dir === 'next' ? 1 : -1));
    }
  };

  const dayLessons = selectedDate ? entries.filter(e => isSameDay(new Date(e.scheduled_at), selectedDate)) : [];
  const weekDays = isAr
    ? ['اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت', 'أحد']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getLessonCountForDay = (date: Date) => entries.filter(e => isSameDay(new Date(e.scheduled_at), date)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('timetable.title')}</h1>
        <div className="flex gap-2">
          <SortButton />
          <div className="flex gap-1 border rounded-lg p-1">
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4 me-1" />
              {isAr ? 'قائمة' : 'List'}
            </Button>
            <Button variant={viewMode === 'calendar' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('calendar')}>
              <CalendarDays className="h-4 w-4 me-1" />
              {isAr ? 'تقويم' : 'Calendar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
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

      {viewMode === 'list' ? (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">{t('timetable.upcoming')} ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">{t('timetable.past')} ({past.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming">
            {renderTable(upItems)}
            <PaginationControls currentPage={upPage} totalPages={upTotal} onPageChange={setUpPage} totalItems={upCount} startIndex={upStart} endIndex={upEnd} />
          </TabsContent>
          <TabsContent value="past">
            {renderTable(pastItems)}
            <PaginationControls currentPage={pastPage} totalPages={pastTotal} onPageChange={setPastPage} totalItems={pastCount} startIndex={pastStart} endIndex={pastEnd} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4">
          {/* Calendar Controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 border rounded-lg p-1">
              <Button variant={calendarMode === 'monthly' ? 'default' : 'ghost'} size="sm" onClick={() => setCalendarMode('monthly')}>
                {isAr ? 'شهري' : 'Monthly'}
              </Button>
              <Button variant={calendarMode === 'weekly' ? 'default' : 'ghost'} size="sm" onClick={() => setCalendarMode('weekly')}>
                {isAr ? 'أسبوعي' : 'Weekly'}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                {calendarMode === 'monthly'
                  ? format(currentDate, 'MMMM yyyy')
                  : `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
                }
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}>
                {isAr ? 'اليوم' : 'Today'}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            {/* Calendar Grid */}
            <Card className="lg:col-span-2">
              <CardContent className="pt-4">
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {weekDays.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const count = getLessonCountForDay(day);
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = calendarMode === 'monthly' ? isSameMonth(day, currentDate) : true;
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all min-h-[60px] ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : isToday(day)
                            ? 'bg-primary/10 text-primary border border-primary/30'
                            : isCurrentMonth
                            ? 'hover:bg-muted text-foreground'
                            : 'text-muted-foreground/40'
                        }`}
                      >
                        <span className="text-sm font-medium">{format(day, 'd')}</span>
                        {count > 0 && (
                          <div className="flex gap-0.5 mt-1">
                            {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSelected ? 'bg-primary-foreground' : 'bg-primary'
                                }`}
                              />
                            ))}
                            {count > 3 && (
                              <span className={`text-[8px] ${isSelected ? 'text-primary-foreground' : 'text-primary'}`}>+{count - 3}</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Day Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {dayLessons.length} {isAr ? 'دروس' : 'lessons'}
                </p>
              </CardHeader>
              <CardContent>
                {dayLessons.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-8 text-center">
                    {isAr ? 'لا توجد دروس في هذا اليوم' : 'No lessons on this day'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dayLessons.map((entry) => (
                      <div key={entry.id} className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold">{format(new Date(entry.scheduled_at), 'HH:mm')}</span>
                          <Badge variant={statusColors[entry.status] as any} className="text-[10px]">
                            {getLabel(timetableStatusLabels, entry.status, isAr)}
                          </Badge>
                        </div>
                        <p className="text-xs font-medium">{entry.courses?.title || '-'}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {entry.teachers_rel?.profiles?.full_name || '-'} → {entry.students?.profiles?.full_name || '-'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{entry.duration_minutes} {t('common.minutes')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'حذف الموعد' : 'Delete Entry'}</AlertDialogTitle>
            <AlertDialogDescription>{isAr ? 'هل أنت متأكد من حذف هذا الموعد؟' : 'Are you sure you want to delete this entry?'}</AlertDialogDescription>
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

export default Timetable;