
-- Security definer function: check if user is enrolled in a course (has active subscription)
CREATE OR REPLACE FUNCTION public.is_enrolled_in_course(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions sub
    JOIN public.students s ON s.id = sub.student_id
    WHERE s.user_id = _user_id
      AND sub.course_id = _course_id
      AND sub.status = 'active'
  )
$$;

-- Revoke public execute so only internal usage
REVOKE EXECUTE ON FUNCTION public.is_enrolled_in_course(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_enrolled_in_course(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_enrolled_in_course(uuid, uuid) TO authenticated;

-- Fix course_sections: replace unconditional SELECT with enrollment check
DROP POLICY IF EXISTS "All can view sections" ON public.course_sections;
CREATE POLICY "Enrolled users can view sections" ON public.course_sections
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'teacher') 
  OR is_enrolled_in_course(auth.uid(), course_id)
);

-- Fix lessons: replace unconditional SELECT with enrollment check via section -> course
DROP POLICY IF EXISTS "All can view lessons" ON public.lessons;
CREATE POLICY "Enrolled users can view lessons" ON public.lessons
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'teacher') 
  OR EXISTS (
    SELECT 1 FROM public.course_sections cs
    WHERE cs.id = section_id
      AND is_enrolled_in_course(auth.uid(), cs.course_id)
  )
);
