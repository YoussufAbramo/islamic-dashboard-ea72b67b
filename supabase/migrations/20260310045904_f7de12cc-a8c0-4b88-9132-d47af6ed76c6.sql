DROP FUNCTION IF EXISTS public.get_invoice_by_share_token(text);

CREATE FUNCTION public.get_invoice_by_share_token(_token text)
 RETURNS TABLE(
   id uuid,
   invoice_number text,
   amount numeric,
   status text,
   billing_cycle text,
   due_date date,
   paid_at timestamptz,
   created_at timestamptz,
   notes text,
   course_id uuid,
   student_id uuid
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT id, invoice_number, amount, status, billing_cycle, due_date, paid_at, created_at, notes, course_id, student_id
  FROM public.invoices WHERE share_token = _token LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_invoice_by_share_token(text) TO anon, authenticated;