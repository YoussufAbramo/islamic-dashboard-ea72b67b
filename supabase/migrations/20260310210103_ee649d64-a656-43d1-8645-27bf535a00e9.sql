-- Create table for storing payment gateway configuration (admin-only)
CREATE TABLE public.payment_gateway_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_id text NOT NULL UNIQUE,
  encrypted_keys jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.payment_gateway_config ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage payment config"
ON public.payment_gateway_config
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));