
-- Policies table (4 fixed pages, no user creation/deletion)
CREATE TABLE public.policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  title_ar text DEFAULT '',
  content text DEFAULT '',
  content_ar text DEFAULT '',
  is_published boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published policies" ON public.policies FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admins can manage policies" ON public.policies FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed 4 fixed policies
INSERT INTO public.policies (slug, title, title_ar) VALUES
  ('privacy-policy', 'Privacy Policy', 'سياسة الخصوصية'),
  ('terms-conditions', 'Terms & Conditions', 'الشروط والأحكام'),
  ('cookies-policy', 'Cookies Policy', 'سياسة ملفات تعريف الارتباط'),
  ('refund-policy', 'Refund Policy', 'سياسة الاسترجاع');

-- Website Pages table (user can create/delete)
CREATE TABLE public.website_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  title_ar text DEFAULT '',
  content text DEFAULT '',
  content_ar text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published pages" ON public.website_pages FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admins can manage pages" ON public.website_pages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Blog Posts table
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  title_ar text DEFAULT '',
  content text DEFAULT '',
  content_ar text DEFAULT '',
  excerpt text DEFAULT '',
  excerpt_ar text DEFAULT '',
  featured_image text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published posts" ON public.blog_posts FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admins can manage posts" ON public.blog_posts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
