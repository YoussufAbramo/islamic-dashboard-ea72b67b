import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePagination } from '@/hooks/use-pagination';
import PaginationControls from '@/components/PaginationControls';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';
import { Plus, Search, Trash2, FileText, Upload, ArrowUp, ArrowDown, BookOpen, Download, Eye, Users, Newspaper, Maximize2, Minimize2 } from 'lucide-react';
import ActionButton from '@/components/ui/action-button';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { TableSkeleton } from '@/components/PageSkeleton';
import LibraryStatsCards from '@/components/library/LibraryStatsCards';
import LibraryEmptyState from '@/components/library/LibraryEmptyState';

interface Ebook {
  id: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  cover_url: string;
  pdf_url: string;
  created_at: string;
}

/** Resolve a storage path or full URL to a signed URL */
async function getEbookSignedUrl(pathOrUrl: string): Promise<string> {
  if (!pathOrUrl) return '';
  // If it's already a full URL, extract the path after /ebooks/
  const bucketPrefix = '/object/public/ebooks/';
  let storagePath = pathOrUrl;
  if (pathOrUrl.includes(bucketPrefix)) {
    storagePath = pathOrUrl.split(bucketPrefix)[1]?.split('?')[0] || '';
  } else if (pathOrUrl.startsWith('http')) {
    // Try to extract path from any supabase storage URL
    const match = pathOrUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/ebooks\/(.+?)(?:\?|$)/);
    if (match) storagePath = decodeURIComponent(match[1]);
    else return pathOrUrl; // external URL, return as-is
  }
  if (!storagePath) return '';
  const { data, error } = await supabase.storage.from('ebooks').createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) return '';
  return data.signedUrl;
}

const Library = () => {
  const { language } = useLanguage();
  const { role, user } = useAuth();
  const isAr = language === 'ar';
  const isAdmin = role === 'admin';

  const trackView = useCallback(async (ebookId: string) => {
    if (!user?.id) return;
    await supabase.from('ebook_views').insert({ ebook_id: ebookId, user_id: user.id });
  }, [user]);

  const trackDownload = useCallback(async (ebookId: string) => {
    if (!user?.id) return;
    await supabase.from('ebook_downloads').insert({ ebook_id: ebookId, user_id: user.id });
  }, [user]);

  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [readerEbook, setReaderEbook] = useState<Ebook | null>(null);
  const [readerPdfUrl, setReaderPdfUrl] = useState('');
  const [readerExpanded, setReaderExpanded] = useState(false);
  const [ebookStats, setEbookStats] = useState<Record<string, { views: number; downloads: number }>>({});
  const [signedCovers, setSignedCovers] = useState<Record<string, string>>({});

  const [form, setForm] = useState({ title: '', title_ar: '', description: '', description_ar: '' });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');

  const fetchEbooks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ebooks')
      .select('*')
      .order('created_at', { ascending: false });
    setEbooks((data as Ebook[]) || []);
    setLoading(false);
  };

  const fetchEbookStats = useCallback(async (ebookIds: string[]) => {
    if (ebookIds.length === 0) return;
    const [viewsRes, downloadsRes] = await Promise.all([
      supabase.from('ebook_views').select('ebook_id'),
      supabase.from('ebook_downloads').select('ebook_id'),
    ]);
    const stats: Record<string, { views: number; downloads: number }> = {};
    ebookIds.forEach(id => { stats[id] = { views: 0, downloads: 0 }; });
    (viewsRes.data || []).forEach((v: any) => { if (stats[v.ebook_id]) stats[v.ebook_id].views++; });
    (downloadsRes.data || []).forEach((d: any) => { if (stats[d.ebook_id]) stats[d.ebook_id].downloads++; });
    setEbookStats(stats);
  }, []);

  useEffect(() => { fetchEbooks(); }, []);
  useEffect(() => { if (ebooks.length > 0) fetchEbookStats(ebooks.map(e => e.id)); }, [ebooks, fetchEbookStats]);

  // Resolve signed cover URLs for all ebooks
  useEffect(() => {
    const resolveCoverUrls = async () => {
      const covers: Record<string, string> = {};
      await Promise.all(
        ebooks.filter(e => e.cover_url).map(async (e) => {
          covers[e.id] = await getEbookSignedUrl(e.cover_url);
        })
      );
      setSignedCovers(covers);
    };
    if (ebooks.length > 0) resolveCoverUrls();
  }, [ebooks]);

  const openReader = useCallback(async (ebook: Ebook) => {
    trackView(ebook.id);
    const signedPdf = await getEbookSignedUrl(ebook.pdf_url);
    setReaderPdfUrl(signedPdf);
    setReaderEbook(ebook);
  }, [trackView]);

  const handleDownload = useCallback(async (ebook: Ebook) => {
    trackDownload(ebook.id);
    const signedPdf = await getEbookSignedUrl(ebook.pdf_url);
    if (signedPdf) {
      const a = document.createElement('a');
      a.href = signedPdf;
      a.download = `${ebook.title}.pdf`;
      a.target = '_blank';
      a.click();
    }
  }, [trackDownload]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleCreate = async (andBlog = false) => {
    if (!form.title.trim() || !pdfFile) {
      toast.error(isAr ? 'العنوان وملف PDF مطلوبان' : 'Title and PDF file are required');
      return;
    }

    setUploading(true);
    try {
      const timestamp = Date.now();
      const pdfPath = `pdfs/${timestamp}-${pdfFile.name}`;
      const { error: pdfError } = await supabase.storage.from('ebooks').upload(pdfPath, pdfFile);
      if (pdfError) throw pdfError;

      // Store paths, not public URLs (bucket is now private)
      let coverPath = '';
      if (coverFile) {
        coverPath = `covers/${timestamp}-${coverFile.name}`;
        const { error: coverError } = await supabase.storage.from('ebooks').upload(coverPath, coverFile);
        if (coverError) throw coverError;
      }

      const { error } = await supabase.from('ebooks').insert({
        title: form.title,
        title_ar: form.title_ar || '',
        description: form.description || '',
        description_ar: form.description_ar || '',
        pdf_url: pdfPath,
        cover_url: coverPath,
      });

      if (error) throw error;

      // Create blog post if requested
      if (andBlog) {
        const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + timestamp;
        const signedPdfForBlog = await getEbookSignedUrl(pdfPath);
        const signedCoverForBlog = coverPath ? await getEbookSignedUrl(coverPath) : '';
        const blogContent = `<p>${form.description || 'Check out this new e-book available in our library.'}</p>\n<p><a href="${signedPdfForBlog}" target="_blank">📖 Read the E-book here</a></p>`;
        const blogContentAr = `<p>${form.description_ar || 'اطلع على هذا الكتاب الإلكتروني الجديد المتاح في مكتبتنا.'}</p>\n<p><a href="${signedPdfForBlog}" target="_blank">📖 اقرأ الكتاب من هنا</a></p>`;

        const { error: blogError } = await supabase.from('blog_posts').insert({
          title: form.title,
          title_ar: form.title_ar || '',
          slug,
          excerpt: form.description || '',
          excerpt_ar: form.description_ar || '',
          content: blogContent,
          content_ar: blogContentAr,
          featured_image: coverUrl || '',
          status: 'published',
          published_at: new Date().toISOString(),
          created_by: user?.id,
        });

        if (blogError) throw blogError;
        toast.success(isAr ? 'تم إضافة الكتاب ونشر المقال' : 'E-book added & blog post published');
      } else {
        toast.success(isAr ? 'تم إضافة الكتاب' : 'E-book added successfully');
      }

      setCreateOpen(false);
      resetForm();
      fetchEbooks();
    } catch (err: any) {
      notifyError({ error: err, isAr, rawMessage: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('ebooks').delete().eq('id', deleteTarget);
    toast.success(isAr ? 'تم حذف الكتاب' : 'E-book deleted');
    setDeleteTarget(null);
    fetchEbooks();
  };

  const resetForm = () => {
    setForm({ title: '', title_ar: '', description: '', description_ar: '' });
    setPdfFile(null);
    setCoverFile(null);
    setCoverPreview('');
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = ebooks.filter((e) =>
      e.title.toLowerCase().includes(q) || e.title_ar?.toLowerCase().includes(q)
    );
    result.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return result;
  }, [ebooks, search, sortOrder]);

  const showEmptyState = !loading && ebooks.length === 0;

  const { currentPage, totalPages, paginatedItems, setCurrentPage, totalItems, startIndex, endIndex } = usePagination(filtered);

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold shrink-0">{isAr ? 'المكتبة' : 'Library'}</h1>
        <div className="flex items-center gap-2 ms-auto">
          <Button variant="outline" size="sm" onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className="gap-1 h-9">
            {sortOrder === 'newest' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
            {sortOrder === 'newest' ? (isAr ? 'الأحدث' : 'Newest') : (isAr ? 'الأقدم' : 'Oldest')}
          </Button>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isAr ? 'بحث...' : 'Search...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9 w-48 sm:w-64"
            />
          </div>
          {isAdmin && (
            <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
              <Plus className="h-4 w-4 me-2" />
              {isAr ? 'إضافة كتاب' : 'Add E-book'}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <LibraryStatsCards ebooks={ebooks} loading={loading} isAr={isAr} />

      {showEmptyState ? (
        <LibraryEmptyState isAr={isAr} isAdmin={isAdmin} onCreateClick={() => { resetForm(); setCreateOpen(true); }} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {paginatedItems.map((ebook) => {
              const title = isAr ? ebook.title_ar || ebook.title : ebook.title;
              const desc = isAr ? ebook.description_ar || ebook.description : ebook.description;
              const stats = ebookStats[ebook.id] || { views: 0, downloads: 0 };
              return (
                <div key={ebook.id} className="group flex flex-col rounded-xl border bg-card overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-200">
                  {/* Cover */}
                  <div className="relative aspect-[3/4] bg-muted overflow-hidden cursor-pointer" onClick={() => { trackView(ebook.id); setReaderEbook(ebook); }}>
                    {ebook.cover_url ? (
                      <img src={ebook.cover_url} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
                        <BookOpen className="h-10 w-10 text-primary/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="relative flex-1 flex flex-col p-3 gap-1.5">
                    {isAdmin && (
                      <ActionButton
                        icon={Trash2}
                        label={isAr ? 'حذف' : 'Delete'}
                        destructive
                        className="absolute top-1.5 end-1.5 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setDeleteTarget(ebook.id)}
                      />
                    )}
                    <h3 className="text-sm font-semibold truncate pe-6" title={title}>{title}</h3>
                    {desc && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{desc}</p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{stats.views}</span>
                      <span className="flex items-center gap-1"><Download className="h-3 w-3" />{stats.downloads}</span>
                    </div>

                    {/* Action bar */}
                    <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-border/50">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => { trackView(ebook.id); setReaderEbook(ebook); }}
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        {isAr ? 'قراءة' : 'Read'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs gap-1 hover:bg-muted"
                        onClick={() => {
                          trackDownload(ebook.id);
                          const a = document.createElement('a');
                          a.href = ebook.pdf_url;
                          a.download = `${ebook.title}.pdf`;
                          a.target = '_blank';
                          a.click();
                        }}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {isAr ? 'تحميل' : 'Download'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'حذف الكتاب' : 'Delete E-book'}</AlertDialogTitle>
            <AlertDialogDescription>{isAr ? 'هل أنت متأكد من حذف هذا الكتاب؟' : 'Are you sure you want to delete this e-book?'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>{isAr ? 'حذف' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{isAr ? 'إضافة كتاب إلكتروني' : 'Add E-book'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{isAr ? 'العنوان (EN)' : 'Title (EN)'} *</Label>
                <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Book title" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'العنوان (AR)' : 'Title (AR)'}</Label>
                <Input value={form.title_ar} onChange={(e) => setForm(f => ({ ...f, title_ar: e.target.value }))} placeholder="عنوان الكتاب" dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{isAr ? 'الوصف (EN)' : 'Description (EN)'}</Label>
                <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'الوصف (AR)' : 'Description (AR)'}</Label>
                <Textarea value={form.description_ar} onChange={(e) => setForm(f => ({ ...f, description_ar: e.target.value }))} placeholder="وصف مختصر" dir="rtl" rows={3} />
              </div>
            </div>

            {/* PDF Upload */}
            <div className="space-y-2">
              <Label>{isAr ? 'ملف PDF' : 'PDF File'} *</Label>
              <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate">
                  {pdfFile ? pdfFile.name : (isAr ? 'اختر ملف PDF...' : 'Choose PDF file...')}
                </span>
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <Label>{isAr ? 'صورة الغلاف' : 'Cover Image'}</Label>
              <div className="flex gap-3 items-start">
                <label className="flex-1 flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">
                    {coverFile ? coverFile.name : (isAr ? 'اختر صورة الغلاف...' : 'Choose cover image...')}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                </label>
                {coverPreview && (
                  <div className="w-16 aspect-[3/4] rounded-md overflow-hidden border shrink-0">
                    <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button variant="secondary" onClick={() => handleCreate(true)} disabled={uploading}>
              <Newspaper className="h-4 w-4 me-2" />
              {uploading ? (isAr ? 'جاري الرفع...' : 'Uploading...') : (isAr ? 'إنشاء ونشر مقال' : 'Create & Blog it!')}
            </Button>
            <Button onClick={() => handleCreate(false)} disabled={uploading}>
              <FileText className="h-4 w-4 me-2" />
              {uploading ? (isAr ? 'جاري الرفع...' : 'Uploading...') : (isAr ? 'إضافة الكتاب' : 'Add E-book')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Reader Dialog */}
      <Dialog open={!!readerEbook} onOpenChange={(open) => { if (!open) { setReaderEbook(null); setReaderExpanded(false); } }}>
        <DialogContent className={readerExpanded ? 'max-w-[100vw] w-[100vw] h-[100vh] rounded-none flex flex-col p-0 gap-0' : 'max-w-5xl h-[90vh] flex flex-col p-0 gap-0'}>
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {readerEbook && (isAr ? readerEbook.title_ar || readerEbook.title : readerEbook.title)}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 ms-auto me-6"
                onClick={() => setReaderExpanded(!readerExpanded)}
                title={readerExpanded ? (isAr ? 'تصغير' : 'Minimize') : (isAr ? 'تكبير' : 'Maximize')}
              >
                {readerExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {readerEbook && (
              <iframe
                src={`${readerEbook.pdf_url}#toolbar=1&navpanes=1`}
                className="w-full h-full border-0"
                title={readerEbook.title}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Library;
