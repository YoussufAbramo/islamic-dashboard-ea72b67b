import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';

const priorityColors: Record<string, string> = { low: 'secondary', medium: 'default', high: 'destructive', urgent: 'destructive' };
const statusColors: Record<string, string> = { open: 'default', in_progress: 'secondary', resolved: 'outline', closed: 'outline' };

const Support = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', department: 'general', priority: 'medium' });

  const fetchTickets = async () => {
    const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    setTickets(data || []);
  };

  useEffect(() => { fetchTickets(); }, []);

  const createTicket = async () => {
    await supabase.from('support_tickets').insert({ ...form, user_id: user?.id });
    toast.success('Ticket created');
    setCreateOpen(false);
    setForm({ name: '', email: '', phone: '', subject: '', message: '', department: 'general', priority: 'medium' });
    fetchTickets();
  };

  const updateStatus = async (ticketId: string, status: string) => {
    await supabase.from('support_tickets').update({ status }).eq('id', ticketId);
    toast.success('Status updated');
    fetchTickets();
    if (selected?.id === ticketId) setSelected({ ...selected, status });
  };

  const filtered = tickets.filter((t) => t.subject.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('support.title')}</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-2" />{t('support.createTicket')}</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{t('support.createTicket')}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t('students.name')}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>{t('students.email')}</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div><Label>{t('students.phone')}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>{t('support.subject')}</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
              <div><Label>{t('support.message')}</Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t('support.department')}</Label>
                  <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">{t('support.general')}</SelectItem>
                      <SelectItem value="technical">{t('support.technical')}</SelectItem>
                      <SelectItem value="billing">{t('support.billing')}</SelectItem>
                      <SelectItem value="academic">{t('support.academic')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('support.priority')}</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('support.low')}</SelectItem>
                      <SelectItem value="medium">{t('support.medium')}</SelectItem>
                      <SelectItem value="high">{t('support.high')}</SelectItem>
                      <SelectItem value="urgent">{t('support.urgent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={createTicket} className="w-full">{t('common.create')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('support.subject')}</TableHead>
              <TableHead>{t('students.name')}</TableHead>
              <TableHead>{t('support.department')}</TableHead>
              <TableHead>{t('support.priority')}</TableHead>
              <TableHead>{t('support.status')}</TableHead>
              <TableHead>{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">{ticket.subject}</TableCell>
                <TableCell>{ticket.name}</TableCell>
                <TableCell>{ticket.department}</TableCell>
                <TableCell><Badge variant={priorityColors[ticket.priority] as any}>{ticket.priority}</Badge></TableCell>
                <TableCell><Badge variant={statusColors[ticket.status] as any}>{ticket.status}</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => { setSelected(ticket); setDetailOpen(true); }}><Eye className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t('support.tickets')} - {selected?.subject}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t('students.name')}</Label><p>{selected.name}</p></div>
                <div><Label>{t('students.email')}</Label><p>{selected.email}</p></div>
                <div><Label>{t('students.phone')}</Label><p>{selected.phone}</p></div>
                <div><Label>{t('support.department')}</Label><p>{selected.department}</p></div>
                <div><Label>{t('support.priority')}</Label><Badge variant={priorityColors[selected.priority] as any}>{selected.priority}</Badge></div>
              </div>
              <div><Label>{t('support.message')}</Label><p className="bg-muted/50 p-2 rounded text-sm">{selected.message}</p></div>
              <div>
                <Label>{t('support.status')}</Label>
                <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">{t('support.open')}</SelectItem>
                    <SelectItem value="in_progress">{t('support.inProgress')}</SelectItem>
                    <SelectItem value="resolved">{t('support.resolved')}</SelectItem>
                    <SelectItem value="closed">{t('support.closed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Support;
