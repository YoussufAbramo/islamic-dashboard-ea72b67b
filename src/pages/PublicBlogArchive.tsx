import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Calendar, ArrowRight, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CopyrightText from '@/components/CopyrightText';
import { format } from 'date-fns';

const PublicBlogArchive = () => {
  const { language } = useLanguage();
  const { pending } = useAppSettings();
  const isAr = language === 'ar';
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const appName = pending.appName || 'Islamic Dashboard';
  const appLogo = pending.appLogo;

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      if (data) setPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-background" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {appLogo ? (
              <img src={appLogo} alt={appName} className="h-8 max-w-[140px] object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">{appName}</span>
              </div>
            )}
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {isAr ? '← العودة للرئيسية' : '← Back to Home'}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            {isAr ? 'المدونة' : 'Blog'}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {isAr ? 'آخر المقالات والأخبار والتحديثات' : 'Latest articles, news, and updates'}
          </p>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl border border-border bg-card animate-pulse">
                  <div className="h-44 bg-muted rounded-t-xl" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-1">{isAr ? 'لا توجد مقالات بعد' : 'No posts yet'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'ترقب المقالات القادمة' : 'Stay tuned for upcoming articles'}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => {
                const title = isAr ? (post.title_ar || post.title) : post.title;
                const excerpt = isAr ? (post.excerpt_ar || post.excerpt) : post.excerpt;
                return (
                  <Link
                    key={post.id}
                    to={`/blogs/${post.slug}`}
                    className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all"
                  >
                    {post.featured_image ? (
                      <div className="h-44 overflow-hidden">
                        <img src={post.featured_image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="h-44 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-primary/30" />
                      </div>
                    )}
                    <div className="p-5 space-y-3">
                      <h2 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{title}</h2>
                      {excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{excerpt}</p>}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {post.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(post.published_at), 'MMM d, yyyy')}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-primary group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform">
                          {isAr ? 'اقرأ المزيد' : 'Read more'} <ArrowRight className="h-3 w-3 rtl:-scale-x-100" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <CopyrightText />
        </div>
      </footer>
    </div>
  );
};

export default PublicBlogArchive;
