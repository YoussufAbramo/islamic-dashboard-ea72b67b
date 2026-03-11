
-- 1. Create lesson_sections table (middle tier)
CREATE TABLE public.lesson_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_section_id uuid NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  title text NOT NULL,
  title_ar text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. RLS policies for lesson_sections
CREATE POLICY "Admin/Teacher can manage lesson_sections"
  ON public.lesson_sections FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Enrolled users can view lesson_sections"
  ON public.lesson_sections FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'teacher'::app_role)
    OR (EXISTS (
      SELECT 1 FROM course_sections cs
      WHERE cs.id = lesson_sections.course_section_id
        AND is_enrolled_in_course(auth.uid(), cs.course_id)
    ))
  );

-- 3. Create a default lesson_section for each existing course_section and migrate lessons
INSERT INTO public.lesson_sections (course_section_id, title, title_ar, sort_order)
SELECT id, 'Default Section', 'قسم افتراضي', 0
FROM public.course_sections;

-- 4. Drop old FK on lessons.section_id
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_section_id_fkey;

-- 5. Update lessons.section_id to point to the new lesson_sections
UPDATE public.lessons l
SET section_id = ls.id
FROM public.lesson_sections ls
JOIN public.course_sections cs ON cs.id = ls.course_section_id
WHERE l.section_id = cs.id;

-- 6. Add new FK referencing lesson_sections
ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_section_id_fkey
  FOREIGN KEY (section_id) REFERENCES public.lesson_sections(id) ON DELETE CASCADE;

-- 7. Update the enrolled users RLS policy on lessons to check via lesson_sections
DROP POLICY IF EXISTS "Enrolled users can view lessons" ON public.lessons;
CREATE POLICY "Enrolled users can view lessons"
  ON public.lessons FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'teacher'::app_role)
    OR (EXISTS (
      SELECT 1 FROM lesson_sections ls
      JOIN course_sections cs ON cs.id = ls.course_section_id
      WHERE ls.id = lessons.section_id
        AND is_enrolled_in_course(auth.uid(), cs.course_id)
    ))
  );
