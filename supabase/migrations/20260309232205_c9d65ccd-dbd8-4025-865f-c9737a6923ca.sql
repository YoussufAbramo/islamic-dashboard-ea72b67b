-- Make avatars bucket private to prevent unauthenticated access
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Add a SELECT policy so authenticated users can read avatars
CREATE POLICY "Authenticated users can read avatars" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');