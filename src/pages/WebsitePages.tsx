import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, Plus, Save, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { TableSkeleton } from '@/components/PageSkeleton';
import ContentEditor from '@/components/ContentEditor';

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

  const fetchPages = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('website_pages').select('*').order('created_at', { ascending: false });
    if (error) notifyError({ error, isAr, rawMessage: error.message });
    setPages((data as WebPage[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPages(); }, []);

  const handleNew = () => {
    setIsNew(true);
    setEditPage({ id: '', slug: '', title: '', title_ar: '', content: '', content_ar: '', status: 'draft', created_at: '', updated_at: '' });
  };

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSave = async () => {
    if (!editPage) return;
    if (!editPage.title.trim()) { toast.error(isAr ? 'العنوان مطلوب' : 'Title is required'); return; }
    if (!editPage.slug.trim()) { toast.error(isAr ? 'الرابط مطلوب' : 'Slug is required'); return; }
    setSaving(true);
    if (isNew) {
      const { error } = await supabase.from('website_pages').insert({
        slug: editPage.slug,
        title: editPage.title,
        title_ar: editPage.title_ar,
        content: editPage.content,
        content_ar: editPage.content_ar,
        status: editPage.status,
        created_by: user?.id,
      });
      if (error) { notifyError({ error, isAr, rawMessage: error.message }); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('website_pages').update({
        title: editPage.title,
        title_ar: editPage.title_ar,
        slug: editPage.slug,
        content: editPage.content,
        content_ar: editPage.content_ar,
        status: editPage.status,
        updated_at: new Date().toISOString(),
      }).eq('id', editPage.id);
      if (error) { notifyError({ error, isAr, rawMessage: error.message }); setSaving(false); return; }
    }
    setSaving(false);
    toast.success(isAr ? 'تم الحفظ' : 'Saved successfully');
    setEditPage(null);
    setIsNew(false);
    fetchPages();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('website_pages').delete().eq('id', id);
    if (error) { notifyError({ error, isAr, rawMessage: error.message }); return; }
    toast.success(isAr ? 'تم الحذف' : 'Deleted');
    fetchPages();
  };

  const filtered = pages.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <TableSkeleton rows={5} cols={4} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {isAr ? 'صفحات الموقع' : 'Website Pages'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{isAr ? 'إنشاء وإدارة صفحات الموقع' : 'Create and manage website pages'}</p>
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
                <div className="flex items-center gap-2">
                  <Badge variant={page.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                    {page.status === 'published' ? (isAr ? 'منشور' : 'Published') : (isAr ? 'مسودة' : 'Draft')}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => { setIsNew(false); setEditPage({ ...page }); }}>
                    {isAr ? 'تعديل' : 'Edit'}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive"><Trash2 className="h-4 w-4" /></Button>
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

      {/* Edit/Create Dialog */}
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
