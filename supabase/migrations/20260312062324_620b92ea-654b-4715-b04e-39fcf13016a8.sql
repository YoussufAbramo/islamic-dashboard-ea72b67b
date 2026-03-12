
-- Track ebook views (readers)
CREATE TABLE public.ebook_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ebook_id UUID NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Track ebook downloads
CREATE TABLE public.ebook_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ebook_id UUID NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS for ebook_views
ALTER TABLE public.ebook_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert own views"
  ON public.ebook_views FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all ebook views"
  ON public.ebook_views FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own views"
  ON public.ebook_views FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- RLS for ebook_downloads
ALTER TABLE public.ebook_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert own downloads"
  ON public.ebook_downloads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all ebook downloads"
  ON public.ebook_downloads FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own downloads"
  ON public.ebook_downloads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
