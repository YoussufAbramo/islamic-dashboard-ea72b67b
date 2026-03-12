-- Fix: Replace overly permissive WITH CHECK (true) on support_tickets INSERT
-- with a check that constrains status and priority defaults
DROP POLICY IF EXISTS "Anyone can submit a contact ticket" ON public.support_tickets;

CREATE POLICY "Anyone can submit a contact ticket"
ON public.support_tickets
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'open'
  AND priority = 'medium'
  AND assigned_to IS NULL
  AND resolution_notes IS NULL
);