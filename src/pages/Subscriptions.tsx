import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';

const Subscriptions = () => {
  const { t } = useLanguage();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ subscription_type: 'monthly', status: 'active', renewal_date: '' });

  const fetchSubscriptions = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*, courses:course_id(title), students:student_id(user_id, profiles:user_id(full_name)), teachers_rel:teacher_id(user_id, profiles:user_id(full_name))')
      .order('created_at', { ascending: false });
    setSubscriptions(data || []);
  };

  useEffect(() => { fetchSubscriptions(); }, []);

  const viewDetails = (sub: any) => {
    setSelected(sub);
    setEditForm({ subscription_type: sub.subscription_type, status: sub.status, renewal_date: sub.renewal_date || '' });
    setDetailOpen(true);
    setEditing(false);
  };

  const saveEdit = async () => {
    await supabase.from('subscriptions').update(editForm).eq('id', selected.id);
    toast.success('Subscription updated');
    setEditing(false);
    fetchSubscriptions();
  };

  const statusColors: Record<string, string> = { active: 'default', expired: 'secondary', cancelled: 'destructive' };

  const filtered = subscriptions.filter((s) => {
    const studentName = s.students?.profiles?.full_name || '';
    const courseName = s.courses?.title || '';
    return studentName.toLowerCase().includes(search.toLowerCase()) || courseName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('subscriptions.title')}</h1>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9" />
      </div>

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
            {filtered.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">{sub.students?.profiles?.full_name || '-'}</TableCell>
                <TableCell>{sub.courses?.title || '-'}</TableCell>
                <TableCell>{sub.teachers_rel?.profiles?.full_name || '-'}</TableCell>
                <TableCell>{sub.subscription_type}</TableCell>
                <TableCell><Badge variant={statusColors[sub.status] as any}>{sub.status}</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => viewDetails(sub)}><Eye className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

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
                        <SelectItem value="monthly">{t('students.monthly')}</SelectItem>
                        <SelectItem value="yearly">{t('students.yearly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>{t('subscriptions.renewalDate')}</Label><Input type="date" value={editForm.renewal_date} onChange={(e) => setEditForm({ ...editForm, renewal_date: e.target.value })} /></div>
                  <div>
                    <Label>{t('subscriptions.status')}</Label>
                    <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t('subscriptions.active')}</SelectItem>
                        <SelectItem value="expired">{t('subscriptions.expired')}</SelectItem>
                        <SelectItem value="cancelled">{t('subscriptions.cancelled')}</SelectItem>
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
                    <div><Label>{t('subscriptions.type')}</Label><p>{selected.subscription_type}</p></div>
                    <div><Label>{t('subscriptions.renewalDate')}</Label><p>{selected.renewal_date || '-'}</p></div>
                    <div><Label>{t('subscriptions.status')}</Label><Badge variant={statusColors[selected.status] as any}>{selected.status}</Badge></div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>{t('common.edit')}</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subscriptions;
