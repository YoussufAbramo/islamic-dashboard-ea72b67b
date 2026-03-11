
-- Auto backup configuration (singleton row)
CREATE TABLE public.auto_backup_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  schedule text NOT NULL DEFAULT 'daily', -- daily, weekly, monthly
  retention_count integer NOT NULL DEFAULT 7,
  format text NOT NULL DEFAULT 'json', -- json, sql, csv
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid DEFAULT NULL
);

ALTER TABLE public.auto_backup_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage auto backup config" ON public.auto_backup_config
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default row (disabled)
INSERT INTO public.auto_backup_config (enabled, schedule, retention_count, format)
VALUES (false, 'daily', 7, 'json');
