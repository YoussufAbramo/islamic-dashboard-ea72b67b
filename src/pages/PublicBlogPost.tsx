import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CopyrightText from '@/components/CopyrightText';

const PublicBlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) { setNotFound(true); setLoading(false); return; }
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      if (error || !data) setNotFound(true);
      else setPost(data);
      setLoading(false);
    };
    fetchPost();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse space-y-4 w-full max-w-2xl px-6">
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-64 bg-muted rounded" />
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-6">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-6">{isAr ? 'المقال غير موجود' : 'Blog post not found'}</p>
      <Button asChild variant="outline"><Link to="/"><ArrowLeft className="h-4 w-4 me-2" />{isAr ? 'الرئيسية' : 'Home'}</Link></Button>
    </div>
  );

  const title = isAr ? (post.title_ar || post.title) : post.title;
  const content = isAr ? (post.content_ar || post.content) : post.content;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft className="h-4 w-4 me-2" />{isAr ? 'الرئيسية' : 'Home'}</Link></Button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        {post.featured_image && (
          <img src={post.featured_image} alt={title} className="w-full h-64 object-cover rounded-xl mb-8" />
        )}
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
          {post.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.published_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
            </span>
          )}
        </div>
        {post.excerpt && <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{isAr ? (post.excerpt_ar || post.excerpt) : post.excerpt}</p>}
        <div className="prose prose-lg max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: content || '' }} />
      </main>
      <footer className="border-t border-border py-6 text-center">
        <CopyrightText />
      </footer>
    </div>
  );
};

export default PublicBlogPost;
