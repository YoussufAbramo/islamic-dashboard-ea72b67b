import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACTION_BTN, ACTION_BTN_DESTRUCTIVE, ACTION_ICON } from '@/lib/actionBtnClass';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileText, Plus, Save, Trash2, Search, ExternalLink, ChevronDown, Image, BookOpen, ArrowRight, Pencil, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { TableSkeleton } from '@/components/PageSkeleton';
import ContentEditor from '@/components/ContentEditor';
import ContactPageEditor from '@/components/settings/ContactPageEditor';

interface WebPage {
  id: string;
  slug: string;
  title: string;
  title_ar: string;
  content: string;
  content_ar: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SeoData {
  meta_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  og_image: string;
}

const emptySeo: SeoData = { meta_title: '', meta_description: '', og_title: '', og_description: '', og_image: '' };

/* ─── System page card (Blogs) ─── */
const SystemPageCard = ({ isAr }: { isAr: boolean }) => {
  const navigate = useNavigate();

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{isAr ? 'المدونة' : 'Blogs'}</p>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{isAr ? 'نظام' : 'System'}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">/blogs</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => window.open('/blogs', '_blank')}>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/blog')} className="gap-1">
            {isAr ? 'إدارة المقالات' : 'Manage Posts'} <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/* ─── System page card (Contact) ─── */
const ContactPageCard = ({ isAr }: { isAr: boolean }) => {
  const [editorOpen, setEditorOpen] = useState(false);
  return (
    <>
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{isAr ? 'تواصل معنا' : 'Contact'}</p>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{isAr ? 'نظام' : 'System'}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">/contact</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className={ACTION_BTN} onClick={() => window.open('/contact', '_blank')}>
              <ExternalLink className={ACTION_ICON} />
            </Button>
            <Button variant="ghost" size="icon" className={ACTION_BTN} onClick={() => setEditorOpen(true)}>
              <Pencil className={ACTION_ICON} />
            </Button>
          </div>
        </CardContent>
      </Card>
      <ContactPageEditor open={editorOpen} onOpenChange={setEditorOpen} />
    </>
  );
};

/* ─── Main component ─── */
const WebsitePages = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === 'ar';
  const [pages, setPages] = useState<WebPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPage, setEditPage] = useState<WebPage | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [seo, setSeo] = useState<SeoData>(emptySeo);
  const [seoOpen, setSeoOpen] = useState(false);

  const fetchPages = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('website_pages').select('*').order('created_at', { ascending: false });
    if (error) notifyError({ error, isAr, rawMessage: error.message });
    setPages((data as WebPage[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPages(); }, []);

  const loadSeo = async (pageId: string) => {
    const { data } = await supabase.from('landing_content').select('content').eq('section_key', `seo_page_${pageId}`).maybeSingle();
    if (data?.content) setSeo({ ...emptySeo, ...(data.content as any) });
    else setSeo(emptySeo);
  };

  const handleNew = () => {
    setIsNew(true);
    setSeo(emptySeo);
    setSeoOpen(false);
    setEditPage({ id: '', slug: '', title: '', title_ar: '', content: '', content_ar: '', status: 'draft', created_at: '', updated_at: '' });
  };

  const handleEdit = async (page: WebPage) => {
    setIsNew(false);
    setEditPage({ ...page });
    setSeoOpen(false);
    await loadSeo(page.id);
  };

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSave = async () => {
    if (!editPage) return;
    if (!editPage.title.trim()) { toast.error(isAr ? 'العنوان مطلوب' : 'Title is required'); return; }
    if (!editPage.slug.trim()) { toast.error(isAr ? 'الرابط مطلوب' : 'Slug is required'); return; }
    setSaving(true);
    let pageId = editPage.id;
    if (isNew) {
      const { data, error } = await supabase.from('website_pages').insert({
        slug: editPage.slug, title: editPage.title, title_ar: editPage.title_ar,
        content: editPage.content, content_ar: editPage.content_ar, status: editPage.status, created_by: user?.id,
      }).select('id').single();
      if (error) { notifyError({ error, isAr, rawMessage: error.message }); setSaving(false); return; }
      pageId = data.id;
    } else {
      const { error } = await supabase.from('website_pages').update({
        title: editPage.title, title_ar: editPage.title_ar, slug: editPage.slug,
        content: editPage.content, content_ar: editPage.content_ar, status: editPage.status, updated_at: new Date().toISOString(),
      }).eq('id', editPage.id);
      if (error) { notifyError({ error, isAr, rawMessage: error.message }); setSaving(false); return; }
    }
    if (seo.meta_title || seo.meta_description || seo.og_title || seo.og_description || seo.og_image) {
      await supabase.from('landing_content').upsert({
        section_key: `seo_page_${pageId}`, content: seo as any, updated_at: new Date().toISOString(),
      }, { onConflict: 'section_key' });
    }
    setSaving(false);
    toast.success(isAr ? 'تم الحفظ' : 'Saved successfully');
    setEditPage(null); setIsNew(false); fetchPages();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('website_pages').delete().eq('id', id);
    if (error) { notifyError({ error, isAr, rawMessage: error.message }); return; }
    toast.success(isAr ? 'تم الحذف' : 'Deleted'); fetchPages();
  };

  const filtered = pages.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <TableSkeleton rows={5} cols={4} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {isAr ? 'الصفحات الرئيسية' : 'Main Pages'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{isAr ? 'إنشاء وإدارة صفحات الموقع' : 'Create and manage main pages'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 w-48 h-9" />
          </div>
          <Button size="sm" className="h-9" onClick={handleNew}>
            <Plus className="h-4 w-4 me-1" />{isAr ? 'صفحة جديدة' : 'New Page'}
          </Button>
        </div>
      </div>

      {/* System Pages */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{isAr ? 'صفحات النظام' : 'System Pages'}</p>
        <SystemPageCard isAr={isAr} />
        <ContactPageCard isAr={isAr} />
      </div>

      {/* Custom Pages */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{isAr ? 'صفحات مخصصة' : 'Custom Pages'}</p>
        {filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{isAr ? 'لا توجد صفحات' : 'No pages yet'}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleNew}>{isAr ? 'إنشاء صفحة' : 'Create Page'}</Button>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map(page => (
              <Card key={page.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{isAr ? page.title_ar || page.title : page.title}</p>
                      <p className="text-xs text-muted-foreground">/pages/{page.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={page.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                      {page.status === 'published' ? (isAr ? 'منشور' : 'Published') : (isAr ? 'مسودة' : 'Draft')}
                    </Badge>
                    {page.status === 'published' && (
                      <Button variant="ghost" size="icon" className={ACTION_BTN} onClick={() => window.open(`/pages/${page.slug}`, '_blank')} title={isAr ? 'عرض' : 'View'}>
                        <ExternalLink className={ACTION_ICON} />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className={ACTION_BTN} onClick={() => handleEdit(page)} title={isAr ? 'تعديل' : 'Edit'}>
                      <Pencil className={ACTION_ICON} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className={ACTION_BTN_DESTRUCTIVE} title={isAr ? 'حذف' : 'Delete'}><Trash2 className={ACTION_ICON} /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{isAr ? 'حذف الصفحة' : 'Delete Page'}</AlertDialogTitle>
                          <AlertDialogDescription>{isAr ? 'هل أنت متأكد؟' : 'Are you sure?'}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(page.id)}>{isAr ? 'حذف' : 'Delete'}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editPage} onOpenChange={(open) => { if (!open) { setEditPage(null); setIsNew(false); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? (isAr ? 'صفحة جديدة' : 'New Page') : (isAr ? 'تعديل الصفحة' : 'Edit Page')}</DialogTitle>
          </DialogHeader>
          {editPage && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Title (EN)</Label><Input value={editPage.title} onChange={e => { setEditPage({ ...editPage, title: e.target.value, slug: isNew ? generateSlug(e.target.value) : editPage.slug }); }} /></div>
                <div><Label>Title (AR)</Label><Input dir="rtl" value={editPage.title_ar} onChange={e => setEditPage({ ...editPage, title_ar: e.target.value })} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Slug</Label><Input value={editPage.slug} onChange={e => setEditPage({ ...editPage, slug: e.target.value })} /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={editPage.status} onValueChange={v => setEditPage({ ...editPage, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{isAr ? 'مسودة' : 'Draft'}</SelectItem>
                      <SelectItem value="published">{isAr ? 'منشور' : 'Published'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Content (EN)</Label>
                <ContentEditor value={editPage.content} onChange={v => setEditPage({ ...editPage, content: v })} />
              </div>
              <div>
                <Label className="mb-2 block">Content (AR)</Label>
                <ContentEditor value={editPage.content_ar} onChange={v => setEditPage({ ...editPage, content_ar: v })} />
              </div>

              <Collapsible open={seoOpen} onOpenChange={setSeoOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2"><Search className="h-4 w-4" />{isAr ? 'إعدادات SEO' : 'SEO Settings'}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${seoOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label>Meta Title</Label><Input value={seo.meta_title} onChange={e => setSeo(p => ({ ...p, meta_title: e.target.value }))} placeholder="Page title for search engines" /></div>
                    <div><Label>OG Title</Label><Input value={seo.og_title} onChange={e => setSeo(p => ({ ...p, og_title: e.target.value }))} placeholder="Title for social sharing" /></div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label>Meta Description</Label><Textarea value={seo.meta_description} onChange={e => setSeo(p => ({ ...p, meta_description: e.target.value }))} rows={2} placeholder="Brief description for search results" /></div>
                    <div><Label>OG Description</Label><Textarea value={seo.og_description} onChange={e => setSeo(p => ({ ...p, og_description: e.target.value }))} rows={2} placeholder="Description for social sharing" /></div>
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5"><Image className="h-3.5 w-3.5" />OG Image URL</Label>
                    <Input value={seo.og_image} onChange={e => setSeo(p => ({ ...p, og_image: e.target.value }))} placeholder="https://..." className="font-mono text-sm" />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setEditPage(null); setIsNew(false); }}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 me-1" />{saving ? '...' : (isAr ? 'حفظ' : 'Save')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebsitePages;
