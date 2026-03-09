
DROP POLICY "Teachers can manage attendance" ON public.attendance;

CREATE POLICY "Teachers can manage attendance" ON public.attendance
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'teacher') AND
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.teachers t ON t.id = s.assigned_teacher_id
      WHERE t.user_id = auth.uid()
    )
  );
