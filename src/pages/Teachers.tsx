import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, Eye } from 'lucide-react';
import { toast } from 'sonner';

const Teachers = () => {
  const { t } = useLanguage();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', specialization: '' });

  const fetchTeachers = async () => {
    const { data } = await supabase.from('teachers').select('*, profiles:user_id(full_name, phone, email)');
    setTeachers(data || []);
  };

  useEffect(() => { fetchTeachers(); }, []);

  const viewDetails = (teacher: any) => {
    setSelected(teacher);
    setProfile(teacher.profiles);
    setEditForm({ bio: teacher.bio || '', specialization: teacher.specialization || '' });
    setDetailOpen(true);
    setEditing(false);
  };

  const saveEdit = async () => {
    await supabase.from('teachers').update(editForm).eq('id', selected.id);
    toast.success('Teacher updated');
    setEditing(false);
    fetchTeachers();
  };

  const filtered = teachers.filter((t) => {
    const name = t.profiles?.full_name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('teachers.title')}</h1>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('teachers.name')}</TableHead>
              <TableHead>{t('teachers.phone')}</TableHead>
              <TableHead>{t('teachers.email')}</TableHead>
              <TableHead>{t('teachers.specialization')}</TableHead>
              <TableHead>{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell className="font-medium">{teacher.profiles?.full_name}</TableCell>
                <TableCell>{teacher.profiles?.phone}</TableCell>
                <TableCell>{teacher.profiles?.email}</TableCell>
                <TableCell>{teacher.specialization}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => viewDetails(teacher)}><Eye className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t('teachers.details')}</DialogTitle></DialogHeader>
          {selected && profile && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t('teachers.name')}</Label><p className="font-medium">{profile.full_name}</p></div>
                <div><Label>{t('teachers.email')}</Label><p>{profile.email}</p></div>
                <div><Label>{t('teachers.phone')}</Label><p>{profile.phone}</p></div>
              </div>
              {editing ? (
                <div className="space-y-3 border-t pt-3">
                  <div><Label>{t('teachers.specialization')}</Label><Input value={editForm.specialization} onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })} /></div>
                  <div><Label>{t('teachers.bio')}</Label><Textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} /></div>
                  <div className="flex gap-2">
                    <Button onClick={saveEdit}>{t('common.save')}</Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>{t('common.cancel')}</Button>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-3 space-y-2">
                  <div><Label>{t('teachers.specialization')}</Label><p>{selected.specialization || '-'}</p></div>
                  <div><Label>{t('teachers.bio')}</Label><p>{selected.bio || '-'}</p></div>
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

export default Teachers;
