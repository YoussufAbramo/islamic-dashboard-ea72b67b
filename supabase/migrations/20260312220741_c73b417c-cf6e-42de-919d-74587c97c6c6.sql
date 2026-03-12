
-- Add financial fields to teachers table
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS hourly_rate numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS required_monthly_hours numeric NOT NULL DEFAULT 0;

-- Create payout_requests table
CREATE TABLE public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  requested_amount numeric NOT NULL,
  available_balance_at_request numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'under_review',
  admin_id uuid REFERENCES auth.users(id),
  decline_reason text,
  admin_notes text,
  transaction_ref text NOT NULL DEFAULT ('PAY-' || substr(gen_random_uuid()::text, 1, 8)),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

-- Enable RLS
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- RLS: Admins can manage all payout requests
CREATE POLICY "Admins can manage payout requests"
ON public.payout_requests
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Teachers can view own payout requests
CREATE POLICY "Teachers can view own payout requests"
ON public.payout_requests
FOR SELECT
TO authenticated
USING (
  teacher_id IN (
    SELECT t.id FROM public.teachers t WHERE t.user_id = auth.uid()
  )
);

-- RLS: Teachers can insert own payout requests
CREATE POLICY "Teachers can insert own payout requests"
ON public.payout_requests
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role)
  AND teacher_id IN (
    SELECT t.id FROM public.teachers t WHERE t.user_id = auth.uid()
  )
  AND status = 'under_review'
);
