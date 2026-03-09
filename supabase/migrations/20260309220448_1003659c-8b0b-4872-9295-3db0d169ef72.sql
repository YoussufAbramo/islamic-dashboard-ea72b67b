
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number text NOT NULL DEFAULT ('INV-' || substr(gen_random_uuid()::text, 1, 8)),
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  student_id uuid NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'pending',
  due_date date NOT NULL DEFAULT (CURRENT_DATE + interval '30 days'),
  paid_at timestamp with time zone,
  notes text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS policies
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view own invoices" ON public.invoices FOR SELECT TO authenticated
  USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));
