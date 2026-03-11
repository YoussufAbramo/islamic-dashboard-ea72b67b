import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CopyrightText from '@/components/CopyrightText';

const PublicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isPolicy = location.pathname.startsWith('/policies/');

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) { setNotFound(true); setLoading(false); return; }
      
      if (isPolicy) {
        const { data, error } = await supabase
          .from('policies')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .maybeSingle();
        if (error || !data) setNotFound(true);
        else setPage({ title: data.title, title_ar: data.title_ar, content: data.content, content_ar: data.content_ar });
      } else {
        const { data, error } = await supabase
          .from('website_pages')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .maybeSingle();
        if (error || !data) setNotFound(true);
        else setPage(data);
      }
      setLoading(false);
    };
    fetchPage();
  }, [slug, isPolicy]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse space-y-4 w-full max-w-2xl px-6">
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="h-64 bg-muted rounded" />
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-6">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-6">{isAr ? 'الصفحة غير موجودة' : 'Page not found'}</p>
      <Button asChild variant="outline"><Link to="/"><ArrowLeft className="h-4 w-4 me-2" />{isAr ? 'الرئيسية' : 'Home'}</Link></Button>
    </div>
  );

  const title = isAr ? (page.title_ar || page.title) : page.title;
  const content = isAr ? (page.content_ar || page.content) : page.content;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft className="h-4 w-4 me-2" />{isAr ? 'الرئيسية' : 'Home'}</Link></Button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">{title}</h1>
        <div className="prose prose-lg max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: content || '' }} />
      </main>
      <footer className="border-t border-border py-6 text-center">
        <CopyrightText />
      </footer>
    </div>
  );
};

export default PublicPage;
