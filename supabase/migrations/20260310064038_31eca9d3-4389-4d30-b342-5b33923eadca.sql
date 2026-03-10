
-- Add original_price and sale_price to invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS original_price numeric DEFAULT NULL;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS sale_price numeric DEFAULT NULL;

-- Add image_url to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';

-- Add weekly_lessons and lesson_duration to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS weekly_lessons integer DEFAULT 1;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS lesson_duration integer DEFAULT 60;

-- Create course-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('course-images', 'course-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload course images
CREATE POLICY "Authenticated users can upload course images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'course-images');

-- Allow public read access to course images
CREATE POLICY "Anyone can view course images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'course-images');

-- Allow admins and teachers to delete course images
CREATE POLICY "Admin/Teacher can delete course images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'course-images');
