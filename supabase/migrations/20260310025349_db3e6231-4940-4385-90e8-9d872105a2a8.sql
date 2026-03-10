CREATE POLICY "Anyone can view invoices by direct link"
ON public.invoices FOR SELECT
TO anon
USING (true);