import { useState, useEffect } from 'react';
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
import { PenLine, Plus, Save, Trash2, Search, Image } from 'lucide-react';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { TableSkeleton } from '@/components/PageSkeleton';
import ContentEditor from '@/components/ContentEditor';
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  title_ar: string;
  content: string;
  content_ar: string;
  excerpt: string;
  excerpt_ar: string;
  featured_image: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const BlogPosts = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === 'ar';
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    if (error) notifyError({ error, isAr, rawMessage: error.message });
    setPosts((data as BlogPost[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleNew = () => {
    setIsNew(true);
    setEditPost({ id: '', slug: '', title: '', title_ar: '', content: '', content_ar: '', excerpt: '', excerpt_ar: '', featured_image: '', status: 'draft', published_at: null, created_at: '', updated_at: '' });
  };

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSave = async () => {
    if (!editPost) return;
    if (!editPost.title.trim()) { toast.error(isAr ? 'العنوان مطلوب' : 'Title is required'); return; }
    if (!editPost.slug.trim()) { toast.error(isAr ? 'الرابط مطلوب' : 'Slug is required'); return; }
    setSaving(true);
    const publishedAt = editPost.status === 'published' && !editPost.published_at ? new Date().toISOString() : editPost.published_at;
    if (isNew) {
      const { error } = await supabase.from('blog_posts').insert({
        slug: editPost.slug,
        title: editPost.title,
        title_ar: editPost.title_ar,
        content: editPost.content,
        content_ar: editPost.content_ar,
        excerpt: editPost.excerpt,
        excerpt_ar: editPost.excerpt_ar,
        featured_image: editPost.featured_image,
        status: editPost.status,
        published_at: publishedAt,
        created_by: user?.id,
      });
      if (error) { notifyError({ error, isAr, rawMessage: error.message }); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('blog_posts').update({
        title: editPost.title,
        title_ar: editPost.title_ar,
        slug: editPost.slug,
        content: editPost.content,
        content_ar: editPost.content_ar,
        excerpt: editPost.excerpt,
        excerpt_ar: editPost.excerpt_ar,
        featured_image: editPost.featured_image,
        status: editPost.status,
        published_at: publishedAt,
        updated_at: new Date().toISOString(),
      }).eq('id', editPost.id);
      if (error) { notifyError({ error, isAr, rawMessage: error.message }); setSaving(false); return; }
    }
    setSaving(false);
    toast.success(isAr ? 'تم الحفظ' : 'Saved successfully');
    setEditPost(null);
    setIsNew(false);
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) { notifyError({ error, isAr, rawMessage: error.message }); return; }
    toast.success(isAr ? 'تم الحذف' : 'Deleted');
    fetchPosts();
  };

  const filtered = posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <TableSkeleton rows={5} cols={4} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PenLine className="h-6 w-6 text-primary" />
            {isAr ? 'المدونة' : 'Blog'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{isAr ? 'كتابة وإدارة المقالات' : 'Write and manage blog posts'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 w-48 h-9" />
          </div>
          <Button size="sm" className="h-9" onClick={handleNew}>
            <Plus className="h-4 w-4 me-1" />{isAr ? 'مقال جديد' : 'New Post'}
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <PenLine className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{isAr ? 'لا توجد مقالات' : 'No blog posts yet'}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={handleNew}>{isAr ? 'كتابة مقال' : 'Write Post'}</Button>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(post => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {post.featured_image ? (
                    <img src={post.featured_image} alt="" className="h-10 w-10 rounded-xl object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <PenLine className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{isAr ? post.title_ar || post.title : post.title}</p>
                    <p className="text-xs text-muted-foreground">/blogs/{post.slug} {post.published_at ? `• ${format(new Date(post.published_at), 'MMM dd, yyyy')}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                    {post.status === 'published' ? (isAr ? 'منشور' : 'Published') : (isAr ? 'مسودة' : 'Draft')}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => { setIsNew(false); setEditPost({ ...post }); }}>
                    {isAr ? 'تعديل' : 'Edit'}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{isAr ? 'حذف المقال' : 'Delete Post'}</AlertDialogTitle>
                        <AlertDialogDescription>{isAr ? 'هل أنت متأكد؟' : 'Are you sure?'}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(post.id)}>{isAr ? 'حذف' : 'Delete'}</AlertDialogAction>
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
      <Dialog open={!!editPost} onOpenChange={(open) => { if (!open) { setEditPost(null); setIsNew(false); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? (isAr ? 'مقال جديد' : 'New Post') : (isAr ? 'تعديل المقال' : 'Edit Post')}</DialogTitle>
          </DialogHeader>
          {editPost && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Title (EN)</Label><Input value={editPost.title} onChange={e => { setEditPost({ ...editPost, title: e.target.value, slug: isNew ? generateSlug(e.target.value) : editPost.slug }); }} /></div>
                <div><Label>Title (AR)</Label><Input dir="rtl" value={editPost.title_ar} onChange={e => setEditPost({ ...editPost, title_ar: e.target.value })} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Slug</Label><Input value={editPost.slug} onChange={e => setEditPost({ ...editPost, slug: e.target.value })} /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={editPost.status} onValueChange={v => setEditPost({ ...editPost, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{isAr ? 'مسودة' : 'Draft'}</SelectItem>
                      <SelectItem value="published">{isAr ? 'منشور' : 'Published'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Excerpt (EN)</Label><Textarea value={editPost.excerpt} onChange={e => setEditPost({ ...editPost, excerpt: e.target.value })} rows={2} placeholder="Brief summary..." /></div>
                <div><Label>Excerpt (AR)</Label><Textarea dir="rtl" value={editPost.excerpt_ar} onChange={e => setEditPost({ ...editPost, excerpt_ar: e.target.value })} rows={2} placeholder="ملخص قصير..." /></div>
              </div>
              <div>
                <Label>Featured Image URL</Label>
                <Input value={editPost.featured_image} onChange={e => setEditPost({ ...editPost, featured_image: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label className="mb-2 block">Content (EN)</Label>
                <ContentEditor value={editPost.content} onChange={v => setEditPost({ ...editPost, content: v })} />
              </div>
              <div>
                <Label className="mb-2 block">Content (AR)</Label>
                <ContentEditor value={editPost.content_ar} onChange={v => setEditPost({ ...editPost, content_ar: v })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setEditPost(null); setIsNew(false); }}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
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

export default BlogPosts;
