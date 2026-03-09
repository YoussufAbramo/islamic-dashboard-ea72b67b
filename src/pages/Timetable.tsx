import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const Timetable = () => {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<any[]>([]);

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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('timetable.title')}</h1>
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">{t('timetable.upcoming')} ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">{t('timetable.past')} ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">{renderTable(upcoming)}</TabsContent>
        <TabsContent value="past">{renderTable(past)}</TabsContent>
      </Tabs>
    </div>
  );
};

export default Timetable;
