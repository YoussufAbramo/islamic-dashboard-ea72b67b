-- Drop overly permissive insert policy and replace with one that restricts to the user's own audit entries
DROP POLICY "System can insert audit logs" ON public.audit_logs;

-- The trigger function uses SECURITY DEFINER so it bypasses RLS.
-- No INSERT policy needed for authenticated users since only the trigger inserts.