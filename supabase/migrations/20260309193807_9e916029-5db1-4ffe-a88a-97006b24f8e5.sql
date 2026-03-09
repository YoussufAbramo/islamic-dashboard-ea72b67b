
-- Create certificates table
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_type text NOT NULL DEFAULT 'student',
  title text NOT NULL,
  title_ar text DEFAULT '',
  description text DEFAULT '',
  description_ar text DEFAULT '',
  issued_at timestamptz NOT NULL DEFAULT now(),
  issued_by uuid REFERENCES public.profiles(id),
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  certificate_number text NOT NULL DEFAULT ('CERT-' || substr(gen_random_uuid()::text, 1, 8)),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage certificates" ON public.certificates
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own certificates" ON public.certificates
  FOR SELECT TO authenticated USING (auth.uid() = recipient_id);

-- Create student_progress table
CREATE TABLE public.student_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  score integer CHECK (score >= 0 AND score <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, lesson_id)
);

ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage progress" ON public.student_progress
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view assigned student progress" ON public.student_progress
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(), 'teacher'::app_role) AND
    student_id IN (
      SELECT s.id FROM students s
      WHERE s.assigned_teacher_id IN (
        SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Students can view own progress" ON public.student_progress
  FOR SELECT TO authenticated USING (
    student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid())
  );

CREATE POLICY "Students can update own progress" ON public.student_progress
  FOR INSERT TO authenticated WITH CHECK (
    student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid())
  );

CREATE POLICY "Students can upsert own progress" ON public.student_progress
  FOR UPDATE TO authenticated USING (
    student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid())
  );

-- Add scheduled_at column to announcements for scheduling
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS target_audience text DEFAULT 'all';
