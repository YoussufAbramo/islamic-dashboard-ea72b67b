
-- Fix student_progress UPDATE policy: add WITH CHECK to prevent student_id tampering
ALTER POLICY "Students can update own progress"
  ON public.student_progress
  USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));

-- Revoke get_user_role from authenticated to prevent role enumeration
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM authenticated;
