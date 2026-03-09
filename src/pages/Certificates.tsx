import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Award, Plus, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Certificates = () => {
  const { role, user } = useAuth();
  const { language } = useLanguage();
  const { appName } = useAppSettings();
  const isAr = language === 'ar';
  const isAdmin = role === 'admin';

  const [certs, setCerts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewCert, setPreviewCert] = useState<any>(null);
  const [form, setForm] = useState({ recipient_id: '', recipient_type: 'student', title: '', title_ar: '', description: '', course_id: '' });
  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    const [certsRes, profilesRes, coursesRes] = await Promise.all([
      supabase.from('certificates').select('*').order('issued_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name'),
      supabase.from('courses').select('id, title, title_ar'),
    ]);
    setCerts(certsRes.data || []);
    setProfiles(profilesRes.data || []);
    setCourses(coursesRes.data || []);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.recipient_id || !form.title) { toast.error(isAr ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields'); return; }
    const { error } = await supabase.from('certificates').insert({
      ...form,
      course_id: form.course_id || null,
      issued_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(isAr ? 'تم إنشاء الشهادة' : 'Certificate created');
    setDialogOpen(false);
    setForm({ recipient_id: '', recipient_type: 'student', title: '', title_ar: '', description: '', course_id: '' });
    fetchData();
  };

  const getProfileName = (id: string) => profiles.find(p => p.id === id)?.full_name || id;
  const getCourseName = (id: string) => {
    const c = courses.find(c => c.id === id);
    return c ? (isAr && c.title_ar ? c.title_ar : c.title) : '';
  };

  const handlePrint = (cert: any) => {
    setPreviewCert(cert);
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{isAr ? 'الشهادات' : 'Certificates'}</h1>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 me-2" />{isAr ? 'شهادة جديدة' : 'New Certificate'}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{isAr ? 'إنشاء شهادة' : 'Create Certificate'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>{isAr ? 'نوع المستلم' : 'Recipient Type'}</Label>
                  <Select value={form.recipient_type} onValueChange={(v) => setForm({ ...form, recipient_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">{isAr ? 'طالب' : 'Student'}</SelectItem>
                      <SelectItem value="teacher">{isAr ? 'معلم' : 'Teacher'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isAr ? 'المستلم' : 'Recipient'}</Label>
                  <Select value={form.recipient_id} onValueChange={(v) => setForm({ ...form, recipient_id: v })}>
                    <SelectTrigger><SelectValue placeholder={isAr ? 'اختر...' : 'Select...'} /></SelectTrigger>
                    <SelectContent>
                      {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isAr ? 'الدورة (اختياري)' : 'Course (optional)'}</Label>
                  <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                    <SelectTrigger><SelectValue placeholder={isAr ? 'اختر...' : 'Select...'} /></SelectTrigger>
                    <SelectContent>
                      {courses.map(c => <SelectItem key={c.id} value={c.id}>{isAr && c.title_ar ? c.title_ar : c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>{isAr ? 'العنوان' : 'Title'}</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>{isAr ? 'العنوان بالعربية' : 'Title (AR)'}</Label><Input value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} dir="rtl" /></div>
                <div><Label>{isAr ? 'الوصف' : 'Description'}</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                <Button onClick={handleCreate} className="w-full">{isAr ? 'إنشاء' : 'Create'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {certs.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-muted-foreground">{isAr ? 'لا توجد شهادات' : 'No certificates'}</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? 'الرقم' : 'Number'}</TableHead>
                  <TableHead>{isAr ? 'العنوان' : 'Title'}</TableHead>
                  <TableHead>{isAr ? 'المستلم' : 'Recipient'}</TableHead>
                  <TableHead>{isAr ? 'الدورة' : 'Course'}</TableHead>
                  <TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead>{isAr ? 'إجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certs.map(cert => (
                  <TableRow key={cert.id}>
                    <TableCell><Badge variant="outline">{cert.certificate_number}</Badge></TableCell>
                    <TableCell>{isAr && cert.title_ar ? cert.title_ar : cert.title}</TableCell>
                    <TableCell>{getProfileName(cert.recipient_id)}</TableCell>
                    <TableCell>{cert.course_id ? getCourseName(cert.course_id) : '—'}</TableCell>
                    <TableCell>{format(new Date(cert.issued_at), 'PP')}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handlePrint(cert)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Printable certificate */}
      {previewCert && (
        <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center no-print" onClick={() => setPreviewCert(null)}>
          <div ref={printRef} className="bg-card border-4 border-double border-primary p-12 max-w-2xl w-full text-center space-y-6 print-only" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center">
              <Award className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary font-amiri">{appName}</h1>
            <p className="text-muted-foreground text-lg">{isAr ? 'شهادة تقدير' : 'Certificate of Achievement'}</p>
            <div className="border-t border-b border-border py-6 space-y-2">
              <p className="text-xl font-semibold">{isAr && previewCert.title_ar ? previewCert.title_ar : previewCert.title}</p>
              <p className="text-lg">{isAr ? 'مقدمة إلى' : 'Presented to'}</p>
              <p className="text-2xl font-bold text-primary">{getProfileName(previewCert.recipient_id)}</p>
              {previewCert.description && <p className="text-muted-foreground">{previewCert.description}</p>}
              {previewCert.course_id && <p className="text-sm">{isAr ? 'الدورة:' : 'Course:'} {getCourseName(previewCert.course_id)}</p>}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{isAr ? 'التاريخ:' : 'Date:'} {format(new Date(previewCert.issued_at), 'PP')}</span>
              <span>{previewCert.certificate_number}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificates;
