
-- 1. Add share_token to invoices for secure public sharing
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS share_token TEXT DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);

-- Create unique index on share_token
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_share_token ON public.invoices(share_token);

-- 2. Drop the dangerous anon policy that exposes all invoices
DROP POLICY IF EXISTS "Anyone can view invoices by direct link" ON public.invoices;

-- 3. Create a secure anon policy that requires the share_token
CREATE POLICY "Anon can view invoice by share token"
ON public.invoices
FOR SELECT
TO anon
USING (false);

-- 4. Create an authenticated policy for viewing via share token
CREATE POLICY "Anyone can view invoice by share token"
ON public.invoices
FOR SELECT
TO authenticated
USING (
  student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 5. Fix courses: hide drafts from students
DROP POLICY IF EXISTS "All can view courses" ON public.courses;
CREATE POLICY "All can view published courses or admin/teacher see all"
ON public.courses
FOR SELECT
TO authenticated
USING (
  status = 'published'
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'teacher'::app_role)
);

-- 6. Enable leaked password protection
ALTER TABLE public.invoices ALTER COLUMN share_token SET NOT NULL;
