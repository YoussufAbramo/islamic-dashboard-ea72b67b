
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.course_categories(id) ON DELETE SET NULL;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS level_id uuid REFERENCES public.course_levels(id) ON DELETE SET NULL;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS track_id uuid REFERENCES public.course_tracks(id) ON DELETE SET NULL;
