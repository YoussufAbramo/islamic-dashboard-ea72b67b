
-- Update the anon policy to allow viewing by share_token via RPC
DROP POLICY IF EXISTS "Anon can view invoice by share token" ON public.invoices;

-- Create a function for fetching invoice by share token (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_invoice_by_share_token(_token text)
RETURNS SETOF invoices
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.invoices WHERE share_token = _token LIMIT 1;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_invoice_by_share_token(text) TO anon, authenticated;
