
-- Security definer functions to break RLS recursion chains

-- Get teacher_id for a given user (bypasses teachers RLS)
CREATE OR REPLACE FUNCTION public.get_teacher_id_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.teachers WHERE user_id = _user_id LIMIT 1
$$;

-- Get student IDs assigned to a teacher user (bypasses students RLS)
CREATE OR REPLACE FUNCTION public.get_student_ids_for_teacher(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id FROM public.students s
  JOIN public.teachers t ON t.id = s.assigned_teacher_id
  WHERE t.user_id = _user_id
$$;

-- Get student user_ids assigned to a teacher user (bypasses both tables RLS)
CREATE OR REPLACE FUNCTION public.get_student_user_ids_for_teacher(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.user_id FROM public.students s
  JOIN public.teachers t ON t.id = s.assigned_teacher_id
  WHERE t.user_id = _user_id
$$;

-- Get the assigned_teacher_id for a student user (bypasses students RLS)
CREATE OR REPLACE FUNCTION public.get_assigned_teacher_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.assigned_teacher_id FROM public.students s
  WHERE s.user_id = _user_id LIMIT 1
$$;

-- Get student_id for a given user (bypasses students RLS)
CREATE OR REPLACE FUNCTION public.get_student_id_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = _user_id LIMIT 1
$$;

-- Grant execute to authenticated and anon
GRANT EXECUTE ON FUNCTION public.get_teacher_id_for_user(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_student_ids_for_teacher(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_student_user_ids_for_teacher(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_assigned_teacher_id(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_student_id_for_user(uuid) TO authenticated, anon;

-- ============================================================
-- Fix profiles: "Teachers can view student profiles" 
-- OLD: subquery into students → teachers (causes recursion)
-- NEW: uses security definer function
-- ============================================================
DROP POLICY IF EXISTS "Teachers can view student profiles" ON public.profiles;
CREATE POLICY "Teachers can view student profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role)
  AND id IN (SELECT get_student_user_ids_for_teacher(auth.uid()))
);

-- ============================================================
-- Fix teachers: "Students can view assigned teacher"
-- OLD: subquery into students (causes recursion back)
-- NEW: uses security definer function
-- ============================================================
DROP POLICY IF EXISTS "Students can view assigned teacher" ON public.teachers;
CREATE POLICY "Students can view assigned teacher"
ON public.teachers FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'student'::app_role)
  AND id = get_assigned_teacher_id(auth.uid())
);

-- ============================================================
-- Fix students: "Teachers can view assigned students"
-- OLD: subquery into teachers (causes recursion)
-- NEW: uses security definer function
-- ============================================================
DROP POLICY IF EXISTS "Teachers can view assigned students" ON public.students;
CREATE POLICY "Teachers can view assigned students"
ON public.students FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role)
  AND id IN (SELECT get_student_ids_for_teacher(auth.uid()))
);

-- ============================================================
-- Fix attendance: "Teachers can manage attendance"
-- Uses subquery into students → teachers (potential recursion)
-- ============================================================
DROP POLICY IF EXISTS "Teachers can manage attendance" ON public.attendance;
CREATE POLICY "Teachers can manage attendance"
ON public.attendance FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role)
  AND student_id IN (SELECT get_student_ids_for_teacher(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role)
  AND student_id IN (SELECT get_student_ids_for_teacher(auth.uid()))
);

-- Fix attendance: "Students can view own attendance"
DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance;
CREATE POLICY "Students can view own attendance"
ON public.attendance FOR SELECT TO authenticated
USING (
  student_id = get_student_id_for_user(auth.uid())
);
