-- 1. Restrict upload policy to admins and teachers only
DROP POLICY IF EXISTS "Authenticated users can upload course images" ON storage.objects;
CREATE POLICY "Admins and teachers can upload course images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'course-images'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'teacher')
    )
  );

-- 2. Add allowed MIME types and file size limit (10MB) to the bucket
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    file_size_limit = 10485760
WHERE id = 'course-images';