import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay } from 'date-fns';
import { List, CalendarDays } from 'lucide-react';

const Timetable = () => {
  const { t, language } = useLanguage();
  const [entries, setEntries] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const fetchEntries = async () => {
      const { data } = await supabase
        .from('timetable_entries')
        .select('*, courses:course_id(title), students:student_id(user_id, profiles:user_id(full_name)), teachers_rel:teacher_id(user_id, profiles:user_id(full_name))')
        .order('scheduled_at', { ascending: true });
      setEntries(data || []);
    };
    fetchEntries();
  }, []);

  const now = new Date().toISOString();
  const upcoming = entries.filter((e) => e.scheduled_at >= now);
  const past = entries.filter((e) => e.scheduled_at < now);

  const statusColors: Record<string, string> = { scheduled: 'default', completed: 'secondary', cancelled: 'destructive' };

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
              <TableCell><Badge variant={statusColors[entry.status] as any}>{t(`timetable.${entry.status}`)}</Badge></TableCell>
            </TableRow>
          ))}
          {items.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );

  const lessonDates = entries.map(e => new Date(e.scheduled_at));
  const hasLessonModifier = (date: Date) => lessonDates.some(d => isSameDay(d, date));
  const dayLessons = selectedDate ? entries.filter(e => isSameDay(new Date(e.scheduled_at), selectedDate)) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('timetable.title')}</h1>
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 me-1" />
            {language === 'ar' ? 'قائمة' : 'List'}
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <CalendarDays className="h-4 w-4 me-1" />
            {language === 'ar' ? 'تقويم' : 'Calendar'}
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">{t('timetable.upcoming')} ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">{t('timetable.past')} ({past.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming">{renderTable(upcoming)}</TabsContent>
          <TabsContent value="past">{renderTable(past)}</TabsContent>
        </Tabs>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'تقويم الدروس' : 'Lessons Calendar'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{ hasLesson: hasLessonModifier }}
                modifiersClassNames={{ hasLesson: 'bg-primary/20 text-primary font-bold' }}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate
                  ? `${language === 'ar' ? 'دروس يوم' : 'Lessons on'} ${format(selectedDate, 'PPP')}`
                  : language === 'ar' ? 'اختر يوماً' : 'Select a day'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dayLessons.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {language === 'ar' ? 'لا توجد دروس في هذا اليوم' : 'No lessons on this day'}
                </p>
              ) : (
                <div className="space-y-3">
                  {dayLessons.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{format(new Date(entry.scheduled_at), 'HH:mm')}</p>
                        <p className="text-xs text-muted-foreground">{entry.courses?.title || '-'}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.teachers_rel?.profiles?.full_name || '-'} → {entry.students?.profiles?.full_name || '-'}
                        </p>
                      </div>
                      <Badge variant={statusColors[entry.status] as any}>{t(`timetable.${entry.status}`)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Timetable;
