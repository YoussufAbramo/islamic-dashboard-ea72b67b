
CREATE TABLE public.session_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_entry_id uuid NOT NULL REFERENCES public.timetable_entries(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  session_duration_seconds integer NOT NULL DEFAULT 0,
  summary text NOT NULL DEFAULT '',
  observations text DEFAULT '',
  performance_remarks text DEFAULT '',
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid DEFAULT NULL
);

ALTER TABLE public.session_reports ENABLE ROW LEVEL SECURITY;

-- Admins can manage all reports
CREATE POLICY "Admins can manage session reports"
ON public.session_reports FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Teachers can insert their own reports
CREATE POLICY "Teachers can insert own session reports"
ON public.session_reports FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role) AND
  teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid())
);

-- Teachers can view their own reports
CREATE POLICY "Teachers can view own session reports"
ON public.session_reports FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid())
);

-- Students can view reports for their sessions
CREATE POLICY "Students can view own session reports"
ON public.session_reports FOR SELECT TO authenticated
USING (
  student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid())
);
