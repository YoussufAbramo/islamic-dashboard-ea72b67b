
CREATE TABLE public.pricing_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  title_ar text DEFAULT '',
  subtitle text DEFAULT '',
  subtitle_ar text DEFAULT '',
  regular_price numeric NOT NULL DEFAULT 0,
  sale_price numeric DEFAULT NULL,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  max_teachers integer NOT NULL DEFAULT 1,
  max_students integer NOT NULL DEFAULT 10,
  max_courses integer NOT NULL DEFAULT 5,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Public read access for landing page
CREATE POLICY "Anyone can view active packages"
  ON public.pricing_packages
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admin management
CREATE POLICY "Admins can manage packages"
  ON public.pricing_packages
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.landing_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Public read access
CREATE POLICY "Anyone can view landing content"
  ON public.landing_content
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin management
CREATE POLICY "Admins can manage landing content"
  ON public.landing_content
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
