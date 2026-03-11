
-- Course Tracks
CREATE TABLE public.course_tracks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  title_ar text DEFAULT '',
  description text DEFAULT '',
  description_ar text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.course_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tracks" ON public.course_tracks FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All authenticated can view tracks" ON public.course_tracks FOR SELECT TO authenticated
  USING (true);

-- Course Categories (with parent/child)
CREATE TABLE public.course_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id uuid REFERENCES public.course_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  title_ar text DEFAULT '',
  description text DEFAULT '',
  description_ar text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage categories" ON public.course_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All authenticated can view categories" ON public.course_categories FOR SELECT TO authenticated
  USING (true);

-- Course Levels
CREATE TABLE public.course_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  title_ar text DEFAULT '',
  description text DEFAULT '',
  description_ar text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.course_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage levels" ON public.course_levels FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All authenticated can view levels" ON public.course_levels FOR SELECT TO authenticated
  USING (true);
