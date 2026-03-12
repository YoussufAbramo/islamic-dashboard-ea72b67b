
-- Allow authenticated users to read active departments
CREATE POLICY "Authenticated can read active departments" ON public.support_departments
  FOR SELECT TO authenticated USING (is_active = true);

-- Allow authenticated users to read active priorities  
CREATE POLICY "Authenticated can read active priorities" ON public.support_priorities
  FOR SELECT TO authenticated USING (is_active = true);
