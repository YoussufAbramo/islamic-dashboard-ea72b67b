
-- Seed sessions: tracks each seeding operation
CREATE TABLE public.seed_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'running',
  categories text[] NOT NULL DEFAULT '{}',
  multiplier integer NOT NULL DEFAULT 1,
  counts jsonb NOT NULL DEFAULT '{}',
  errors text[] NOT NULL DEFAULT '{}',
  cleared_at timestamptz,
  total_records integer NOT NULL DEFAULT 0
);

-- Seed records: tracks every individual record created by seeding
CREATE TABLE public.seed_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.seed_sessions(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  record_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast cleanup lookups
CREATE INDEX idx_seed_records_session ON public.seed_records(session_id);
CREATE INDEX idx_seed_records_table ON public.seed_records(table_name, record_id);

-- RLS: admin only
ALTER TABLE public.seed_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seed_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage seed_sessions"
ON public.seed_sessions FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage seed_records"
ON public.seed_records FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
