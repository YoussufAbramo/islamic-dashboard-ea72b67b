-- Fix 1: Revoke role-enumeration functions from authenticated users
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;

-- Ensure postgres (owner) retains access for RLS policy evaluation
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO postgres;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO postgres;

-- Fix 2: Restrict course-images storage policies
DROP POLICY IF EXISTS "Authenticated users can upload course images" ON storage.objects;
DROP POLICY IF EXISTS "Admin/Teacher can delete course images" ON storage.objects;

CREATE POLICY "Admin/Teacher can upload course images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'course-images'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
);

CREATE POLICY "Admin can delete course images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'course-images'
  AND public.has_role(auth.uid(), 'admin')
);