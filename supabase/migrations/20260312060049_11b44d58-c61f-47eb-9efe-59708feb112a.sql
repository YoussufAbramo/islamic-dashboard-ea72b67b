ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS google_meet_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS zoom_url text DEFAULT '';