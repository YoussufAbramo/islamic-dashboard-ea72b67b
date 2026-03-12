-- Allow anonymous users to submit support tickets via the public contact form
CREATE POLICY "Anyone can submit a contact ticket"
ON public.support_tickets
FOR INSERT
TO anon
WITH CHECK (true);