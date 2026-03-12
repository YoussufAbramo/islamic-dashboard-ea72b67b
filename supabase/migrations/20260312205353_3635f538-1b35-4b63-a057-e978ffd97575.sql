
-- Create the unified 'media' bucket (private by default for security)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the media bucket
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow authenticated users to read media files
CREATE POLICY "Authenticated users can read media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'media');

-- Allow users to update their own uploads
CREATE POLICY "Users can update own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'media');

-- Admins can delete media
CREATE POLICY "Admins can delete media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

-- Allow anon to read course and website assets (public-facing content)
CREATE POLICY "Public can read course and website media"
ON storage.objects FOR SELECT
TO anon
USING (
  bucket_id = 'media' 
  AND (
    name LIKE 'courses/%'
    OR name LIKE 'website/%'
    OR name LIKE 'system/%'
  )
);
