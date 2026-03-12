
-- Add title column to teachers
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS title text DEFAULT '';

-- Create teacher_courses junction table
CREATE TABLE IF NOT EXISTS public.teacher_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, course_id)
);

-- Enable RLS
ALTER TABLE public.teacher_courses ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage teacher_courses"
ON public.teacher_courses FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Teachers can view own assignments
CREATE POLICY "Teachers can view own course assignments"
ON public.teacher_courses FOR SELECT TO authenticated
USING (teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()));

-- All authenticated can view (for display purposes)
CREATE POLICY "Authenticated can view teacher_courses"
ON public.teacher_courses FOR SELECT TO authenticated
USING (true);
