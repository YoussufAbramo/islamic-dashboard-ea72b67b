-- 1. Drop the blanket SELECT policy that exposes all teacher fields to everyone
DROP POLICY IF EXISTS "All authenticated can view teachers" ON public.teachers;

-- 2. Teachers can view their own record (all fields)
CREATE POLICY "Teachers can view own record"
ON public.teachers FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 3. Students can view their assigned teacher row
CREATE POLICY "Students can view assigned teacher"
ON public.teachers FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'student'::app_role)
  AND id IN (
    SELECT assigned_teacher_id FROM public.students
    WHERE user_id = auth.uid() AND assigned_teacher_id IS NOT NULL
  )
);

-- 4. Create a security-definer function for the landing page instructors list
-- This returns only non-sensitive fields and is callable by anon/authenticated
CREATE OR REPLACE FUNCTION public.get_public_teachers(max_count int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  specialization text,
  bio text,
  title text,
  full_name text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.specialization, t.bio, t.title,
         p.full_name, p.avatar_url
  FROM public.teachers t
  JOIN public.profiles p ON p.id = t.user_id
  LIMIT max_count;
$$;