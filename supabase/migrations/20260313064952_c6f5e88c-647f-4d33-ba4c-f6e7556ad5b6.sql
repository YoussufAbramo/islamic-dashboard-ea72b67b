ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS slug text;

-- Generate slugs for existing courses that don't have one
UPDATE public.courses SET slug = LOWER(REPLACE(REPLACE(REPLACE(title, ' ', '-'), '''', ''), '"', '')) WHERE slug IS NULL OR slug = '';

-- Create unique index on slug (allow nulls)
CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_unique ON public.courses (slug) WHERE slug IS NOT NULL AND slug != '';