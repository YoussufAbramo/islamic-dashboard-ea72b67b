
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS cv_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS contract_url text DEFAULT '';
