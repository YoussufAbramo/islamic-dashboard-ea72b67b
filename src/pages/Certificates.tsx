import { useEffect, useState } from 'react';
import { usePagination } from '@/hooks/use-pagination';
import PaginationControls from '@/components/PaginationControls';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Award, Plus, Check, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type CertDesign = 'classic' | 'modern' | 'elegant';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ recipient_id: '', recipient_type: 'student', title: '', title_ar: '', description: '', course_id: '', design: 'classic' as CertDesign });

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
    setForm({ recipient_id: '', recipient_type: 'student', title: '', title_ar: '', description: '', course_id: '', design: 'classic' });
    fetchData();
  };

  const getProfileName = (id: string) => profiles.find(p => p.id === id)?.full_name || id;
  const getCourseName = (id: string) => {
    const c = courses.find(c => c.id === id);
    return c ? (isAr && c.title_ar ? c.title_ar : c.title) : '';
  };

  const handlePrint = (cert: any, design: CertDesign = 'classic') => {
    setTimeout(() => {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) { window.print(); return; }
      const certTitle = isAr && cert.title_ar ? cert.title_ar : cert.title;
      const recipientName = getProfileName(cert.recipient_id);
      const courseName = cert.course_id ? getCourseName(cert.course_id) : '';
      const designStyles: Record<CertDesign, { border: string; bg: string; accent: string }> = {
        classic: { border: '4px double #c8a84e', bg: '#fffef7', accent: '#287a5e' },
        modern: { border: '3px solid #2563eb', bg: '#f8fafc', accent: '#2563eb' },
        elegant: { border: '5px double #7c3aed', bg: '#faf5ff', accent: '#7c3aed' },
      };
      const ds = designStyles[design];
      printWindow.document.write(`
        <html><head><title>Certificate</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 40px; font-family: 'Inter', 'Cairo', sans-serif; }
          .cert { border: ${ds.border}; background: ${ds.bg}; padding: 60px; text-align: center; max-width: 700px; margin: auto; }
          .cert h1 { color: ${ds.accent}; font-size: 28px; margin: 0; }
          .cert .sub { color: #666; font-size: 16px; margin: 10px 0 30px; }
          .cert .title { font-size: 22px; font-weight: 600; margin: 20px 0; }
          .cert .name { font-size: 26px; font-weight: 700; color: ${ds.accent}; margin: 15px 0; }
          .cert .divider { border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 20px 0; margin: 20px 0; }
          .cert .footer { display: flex; justify-content: space-between; color: #999; font-size: 12px; margin-top: 30px; }
          @media print { body { padding: 0; } }
        </style></head><body>
        <div class="cert">
          <h1>${appName}</h1>
          <p class="sub">${isAr ? 'شهادة تقدير' : 'Certificate of Achievement'}</p>
          <div class="divider">
            <p class="title">${certTitle}</p>
            <p>${isAr ? 'مقدمة إلى' : 'Presented to'}</p>
            <p class="name">${recipientName}</p>
            ${cert.description ? `<p style="color:#666">${cert.description}</p>` : ''}
            ${courseName ? `<p style="font-size:14px;color:#888">${isAr ? 'الدورة:' : 'Course:'} ${courseName}</p>` : ''}
          </div>
          <div class="footer">
            <span>${isAr ? 'التاريخ:' : 'Date:'} ${format(new Date(cert.issued_at), 'PP')}</span>
            <span>${cert.certificate_number}</span>
          </div>
        </div>
        <script>window.onload=function(){window.print();window.close();}</script>
        </body></html>
      `);
      printWindow.document.close();
    }, 100);
  };

  const designOptions: { value: CertDesign; label: string; labelAr: string; color: string }[] = [
    { value: 'classic', label: 'Classic', labelAr: 'كلاسيكي', color: '#c8a84e' },
    { value: 'modern', label: 'Modern', labelAr: 'حديث', color: '#2563eb' },
    { value: 'elegant', label: 'Elegant', labelAr: 'أنيق', color: '#7c3aed' },
  ];

  const filteredCerts = certs.filter(cert => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const title = (isAr && cert.title_ar ? cert.title_ar : cert.title).toLowerCase();
    const recipient = getProfileName(cert.recipient_id).toLowerCase();
    const course = cert.course_id ? getCourseName(cert.course_id).toLowerCase() : '';
    const number = cert.certificate_number.toLowerCase();
    return title.includes(q) || recipient.includes(q) || course.includes(q) || number.includes(q);
  });

  const { currentPage, totalPages, paginatedItems, setCurrentPage, totalItems, startIndex, endIndex } = usePagination(filteredCerts);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold shrink-0">{isAr ? 'الشهادات' : 'Certificates'}</h1>
        <div className="flex items-center gap-2 ms-auto">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isAr ? 'بحث...' : 'Search...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 w-48 sm:w-64"
            />
          </div>
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
                <div>
                  <Label>{isAr ? 'تصميم الشهادة' : 'Certificate Design'}</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {designOptions.map(d => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setForm({ ...form, design: d.value })}
                        className={`relative p-3 rounded-lg border-2 text-center transition-all ${form.design === d.value ? 'border-primary shadow-md' : 'border-border'}`}
                      >
                        <div className="w-6 h-6 rounded-full mx-auto mb-1" style={{ backgroundColor: d.color }} />
                        <span className="text-xs">{isAr ? d.labelAr : d.label}</span>
                        {form.design === d.value && <Check className="absolute top-1 end-1 h-3 w-3 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full">{isAr ? 'إنشاء' : 'Create'}</Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {filteredCerts.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-muted-foreground">
          {searchQuery
            ? (isAr ? 'لا توجد نتائج مطابقة' : 'No matching results')
            : (isAr ? 'لا توجد شهادات' : 'No certificates')}
        </CardContent></Card>
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
                {filteredCerts.map(cert => (
                  <TableRow key={cert.id}>
                    <TableCell><Badge variant="outline">{cert.certificate_number}</Badge></TableCell>
                    <TableCell>{isAr && cert.title_ar ? cert.title_ar : cert.title}</TableCell>
                    <TableCell>{getProfileName(cert.recipient_id)}</TableCell>
                    <TableCell>{cert.course_id ? getCourseName(cert.course_id) : '—'}</TableCell>
                    <TableCell>{format(new Date(cert.issued_at), 'PP')}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {designOptions.map(d => (
                          <Button key={d.value} variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => handlePrint(cert, d.value)} title={isAr ? d.labelAr : d.label}>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Certificates;
