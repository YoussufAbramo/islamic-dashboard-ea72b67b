
-- Single-row key-value settings table storing all app settings as JSONB
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon for landing page) can read settings
CREATE POLICY "Anyone can view app settings"
  ON public.app_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage app settings"
  ON public.app_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert a default row so there's always one
INSERT INTO public.app_settings (settings) VALUES ('{}'::jsonb);
