import { useEffect, useState, useMemo } from 'react';
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
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Award, Plus, Check, Search, ArrowUp, ArrowDown, Trash2, Download, ChevronsUpDown, Printer, LayoutGrid, List, MoreHorizontal, Eye } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { format } from 'date-fns';
import { certificateStatusLabels, getLabel } from '@/lib/statusLabels';
import { exportCertificatePdf } from '@/lib/certificatePdf';
import { cn } from '@/lib/utils';
import { TableSkeleton, CertificateGridSkeleton } from '@/components/PageSkeleton';

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
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [loading, setLoading] = useState(true);
  const [previewCert, setPreviewCert] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    const [certsRes, profilesRes, coursesRes] = await Promise.all([
      supabase.from('certificates').select('*').order('issued_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name'),
      supabase.from('courses').select('id, title, title_ar'),
    ]);
    setCerts(certsRes.data || []);
    setProfiles(profilesRes.data || []);
    setCourses(coursesRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.recipient_id || !form.title) { notifyError({ error: 'VAL_REQUIRED_FIELDS', isAr }); return; }
    const { error } = await supabase.from('certificates').insert({
      ...form,
      course_id: form.course_id || null,
      issued_by: user?.id,
    });
    if (error) { notifyError({ error, isAr, rawMessage: error.message }); return; }
    toast.success(isAr ? 'تم إنشاء الشهادة' : 'Certificate created');
    setDialogOpen(false);
    setForm({ recipient_id: '', recipient_type: 'student', title: '', title_ar: '', description: '', course_id: '', design: 'classic' });
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('certificates').delete().eq('id', deleteTarget);
    toast.success(isAr ? 'تم حذف الشهادة' : 'Certificate deleted');
    setDeleteTarget(null);
    fetchData();
  };

  const getProfileName = (id: string) => profiles.find(p => p.id === id)?.full_name || id;
  const getCourseName = (id: string) => {
    const c = courses.find(c => c.id === id);
    return c ? (isAr && c.title_ar ? c.title_ar : c.title) : '';
  };

  const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const handleExportPdf = async (cert: any, design: CertDesign) => {
    toast.info(isAr ? 'جاري تصدير PDF...' : 'Exporting PDF...');
    try {
      await exportCertificatePdf({
        title: isAr && cert.title_ar ? cert.title_ar : cert.title,
        recipientName: getProfileName(cert.recipient_id),
        description: cert.description || '',
        courseName: cert.course_id ? getCourseName(cert.course_id) : '',
        date: format(new Date(cert.issued_at), 'PP'),
        certNumber: cert.certificate_number,
        appName,
        design,
        isAr,
      });
    } catch {
      notifyError({ error: 'STORAGE_EXPORT_FAILED', isAr });
    }
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
          <h1>${esc(appName)}</h1>
          <p class="sub">${isAr ? 'شهادة تقدير' : 'Certificate of Achievement'}</p>
          <div class="divider">
            <p class="title">${esc(certTitle)}</p>
            <p>${isAr ? 'مقدمة إلى' : 'Presented to'}</p>
            <p class="name">${esc(recipientName)}</p>
            ${cert.description ? `<p style="color:#666">${esc(cert.description)}</p>` : ''}
            ${courseName ? `<p style="font-size:14px;color:#888">${isAr ? 'الدورة:' : 'Course:'} ${esc(courseName)}</p>` : ''}
          </div>
          <div class="footer">
            <span>${isAr ? 'التاريخ:' : 'Date:'} ${format(new Date(cert.issued_at), 'PP')}</span>
            <span>${esc(cert.certificate_number)}</span>
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

  const statusCounts = {
    all: certs.length,
    active: certs.filter(c => c.status === 'active').length,
    revoked: certs.filter(c => c.status === 'revoked').length,
  };

  const filteredCerts = useMemo(() => {
    let result = certs.filter(cert => {
      const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
      if (!matchesStatus) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const title = (isAr && cert.title_ar ? cert.title_ar : cert.title).toLowerCase();
      const recipient = getProfileName(cert.recipient_id).toLowerCase();
      const course = cert.course_id ? getCourseName(cert.course_id).toLowerCase() : '';
      const number = cert.certificate_number.toLowerCase();
      return title.includes(q) || recipient.includes(q) || course.includes(q) || number.includes(q);
    });
    result.sort((a, b) => {
      const da = new Date(a.issued_at).getTime();
      const db = new Date(b.issued_at).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return result;
  }, [certs, searchQuery, sortOrder, isAr, statusFilter]);

  const [form, setForm] = useState({ recipient_id: '', recipient_type: 'student', title: '', title_ar: '', description: '', course_id: '', design: 'classic' as CertDesign });
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [certCourseOpen, setCertCourseOpen] = useState(false);

  const { currentPage, totalPages, paginatedItems, setCurrentPage, totalItems, startIndex, endIndex } = usePagination(filteredCerts);

  const statusColors: Record<string, string> = { active: 'default', revoked: 'destructive' };

  const CertActionsMenu = ({ cert }: { cert: any }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{isAr ? 'طباعة' : 'Print'}</DropdownMenuLabel>
        {designOptions.map(d => (
          <DropdownMenuItem key={`print-${d.value}`} onClick={() => handlePrint(cert, d.value)}>
            <Printer className="h-3.5 w-3.5 me-2" style={{ color: d.color }} />
            {isAr ? d.labelAr : d.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{isAr ? 'تصدير PDF' : 'Export PDF'}</DropdownMenuLabel>
        {designOptions.map(d => (
          <DropdownMenuItem key={`pdf-${d.value}`} onClick={() => handleExportPdf(cert, d.value)}>
            <Download className="h-3.5 w-3.5 me-2" style={{ color: d.color }} />
            {isAr ? d.labelAr : d.label}
          </DropdownMenuItem>
        ))}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(cert.id)}>
              <Trash2 className="h-3.5 w-3.5 me-2" />
              {isAr ? 'حذف' : 'Delete'}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Certificate preview card for grid view
  const CertPreviewCard = ({ cert }: { cert: any }) => {
    const certTitle = isAr && cert.title_ar ? cert.title_ar : cert.title;
    const recipientName = getProfileName(cert.recipient_id);
    const courseName = cert.course_id ? getCourseName(cert.course_id) : '';
    return (
      <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/30 overflow-hidden">
        {/* Mini certificate preview */}
        <div
          className="p-4 text-center border-b cursor-pointer"
          style={{ background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--background)) 100%)' }}
          onClick={() => setPreviewCert(cert)}
        >
          <div className="border-2 border-dashed border-primary/20 rounded-lg p-4 space-y-1">
            <Award className="h-6 w-6 text-primary mx-auto" />
            <p className="text-xs font-semibold text-primary truncate">{certTitle}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? 'مقدمة إلى' : 'Presented to'}</p>
            <p className="text-sm font-bold truncate">{recipientName}</p>
            {courseName && <p className="text-[10px] text-muted-foreground truncate">{courseName}</p>}
          </div>
        </div>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant={statusColors[cert.status] as any} className="text-[10px]">
              {getLabel(certificateStatusLabels, cert.status, isAr)}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{format(new Date(cert.issued_at), 'PP')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-mono">{cert.certificate_number}</span>
            <CertActionsMenu cert={cert} />
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Award className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">{isAr ? 'الشهادات' : 'Certificates'}</h1>
        </div>
        {viewMode === 'grid' ? <CertificateGridSkeleton /> : <TableSkeleton cols={7} />}
      </div>
    );
  }

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold shrink-0">{isAr ? 'الشهادات' : 'Certificates'}</h1>
        <div className="flex items-center gap-2 ms-auto">
          {/* View toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" className="h-8 w-8 rounded-none" onClick={() => setViewMode('list')}>
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" className="h-8 w-8 rounded-none" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className="gap-1">
            {sortOrder === 'newest' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
            {sortOrder === 'newest' ? (isAr ? 'الأحدث' : 'Newest') : (isAr ? 'الأقدم' : 'Oldest')}
          </Button>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? 'بحث...' : 'Search...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="ps-9 w-48 sm:w-64" />
          </div>
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 me-2" />{isAr ? 'شهادة جديدة' : 'New Certificate'}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
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
                    <Popover open={recipientOpen} onOpenChange={setRecipientOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                          {form.recipient_id ? getProfileName(form.recipient_id) : (isAr ? 'اختر...' : 'Select...')}
                          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder={isAr ? 'بحث...' : 'Search...'} />
                          <CommandList>
                            <CommandEmpty>{isAr ? 'لا توجد نتائج' : 'No results'}</CommandEmpty>
                            <CommandGroup>
                              {profiles.map(p => (
                                <CommandItem key={p.id} value={p.full_name} onSelect={() => { setForm({ ...form, recipient_id: p.id }); setRecipientOpen(false); }}>
                                  <Check className={cn("me-2 h-4 w-4", form.recipient_id === p.id ? "opacity-100" : "opacity-0")} />
                                  {p.full_name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>{isAr ? 'الدورة (اختياري)' : 'Course (optional)'}</Label>
                    <Popover open={certCourseOpen} onOpenChange={setCertCourseOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                          {form.course_id ? getCourseName(form.course_id) : (isAr ? 'اختر...' : 'Select...')}
                          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder={isAr ? 'بحث...' : 'Search...'} />
                          <CommandList>
                            <CommandEmpty>{isAr ? 'لا توجد نتائج' : 'No results'}</CommandEmpty>
                            <CommandGroup>
                              {courses.map(c => (
                                <CommandItem key={c.id} value={isAr && c.title_ar ? c.title_ar : c.title} onSelect={() => { setForm({ ...form, course_id: c.id }); setCertCourseOpen(false); }}>
                                  <Check className={cn("me-2 h-4 w-4", form.course_id === c.id ? "opacity-100" : "opacity-0")} />
                                  {isAr && c.title_ar ? c.title_ar : c.title}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>{isAr ? 'العنوان' : 'Title'}</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                    <div><Label>{isAr ? 'العنوان بالعربية' : 'Title (AR)'}</Label><Input value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} dir="rtl" className="text-right" /></div>
                  </div>
                  <div><Label>{isAr ? 'الوصف' : 'Description'}</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                  <div>
                    <Label>{isAr ? 'تصميم الشهادة' : 'Certificate Design'}</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {designOptions.map(d => (
                        <button key={d.value} type="button" onClick={() => setForm({ ...form, design: d.value })} className={`relative p-3 rounded-lg border-2 text-center transition-all ${form.design === d.value ? 'border-primary shadow-md' : 'border-border'}`}>
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

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          {Object.entries(statusCounts).map(([key, count]) => (
            <TabsTrigger key={key} value={key} className="text-xs gap-1.5">
              {key === 'all' ? (isAr ? 'الكل' : 'All') : getLabel(certificateStatusLabels, key, isAr)}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-[18px]">{count}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filteredCerts.length === 0 ? (
        <EmptyState
          icon={Award}
          title={searchQuery ? (isAr ? 'لا توجد نتائج مطابقة' : 'No matching results') : (isAr ? 'لا توجد شهادات' : 'No certificates')}
          description={searchQuery ? undefined : (isAr ? 'أنشئ شهادة جديدة للطلاب أو المعلمين' : 'Create a new certificate for students or teachers')}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedItems.map(cert => (
            <CertPreviewCard key={cert.id} cert={cert} />
          ))}
        </div>
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
                  <TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead>{isAr ? 'إجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map(cert => (
                  <TableRow key={cert.id}>
                    <TableCell><Badge variant="outline">{cert.certificate_number}</Badge></TableCell>
                    <TableCell>{isAr && cert.title_ar ? cert.title_ar : cert.title}</TableCell>
                    <TableCell>{getProfileName(cert.recipient_id)}</TableCell>
                    <TableCell>{cert.course_id ? getCourseName(cert.course_id) : '—'}</TableCell>
                    <TableCell><Badge variant={statusColors[cert.status] as any}>{getLabel(certificateStatusLabels, cert.status, isAr)}</Badge></TableCell>
                    <TableCell>{format(new Date(cert.issued_at), 'PP')}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setPreviewCert(cert)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <CertActionsMenu cert={cert} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />

      {/* Certificate Preview Dialog */}
      <Dialog open={!!previewCert} onOpenChange={(open) => !open && setPreviewCert(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{isAr ? 'معاينة الشهادة' : 'Certificate Preview'}</DialogTitle></DialogHeader>
          {previewCert && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-primary/20 rounded-xl p-8 text-center" style={{ background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--background)) 100%)' }}>
                <Award className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-xs tracking-widest text-primary uppercase mb-2">{isAr ? '✦ شهادة ✦' : '✦ Certificate ✦'}</p>
                <h2 className="text-xl font-bold text-primary mb-1">{appName}</h2>
                <p className="text-sm text-muted-foreground mb-4">{isAr ? 'شهادة تقدير' : 'Certificate of Achievement'}</p>
                <div className="border-t border-b border-border py-4 space-y-2">
                  <p className="text-lg font-semibold">{isAr && previewCert.title_ar ? previewCert.title_ar : previewCert.title}</p>
                  <p className="text-sm text-muted-foreground">{isAr ? 'مقدمة إلى' : 'Presented to'}</p>
                  <p className="text-2xl font-bold text-primary">{getProfileName(previewCert.recipient_id)}</p>
                  {previewCert.description && <p className="text-sm text-muted-foreground">{previewCert.description}</p>}
                  {previewCert.course_id && <p className="text-xs text-muted-foreground">{isAr ? 'الدورة:' : 'Course:'} {getCourseName(previewCert.course_id)}</p>}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-4">
                  <span>{isAr ? 'التاريخ:' : 'Date:'} {format(new Date(previewCert.issued_at), 'PP')}</span>
                  <span>{previewCert.certificate_number}</span>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                {designOptions.map(d => (
                  <Button key={d.value} variant="outline" size="sm" onClick={() => handlePrint(previewCert, d.value)}>
                    <Printer className="h-3.5 w-3.5 me-1.5" style={{ color: d.color }} />
                    {isAr ? d.labelAr : d.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'حذف الشهادة' : 'Delete Certificate'}</AlertDialogTitle>
            <AlertDialogDescription>{isAr ? 'هل أنت متأكد من حذف هذه الشهادة؟' : 'Are you sure you want to delete this certificate?'}</AlertDialogDescription>
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

export default Certificates;
