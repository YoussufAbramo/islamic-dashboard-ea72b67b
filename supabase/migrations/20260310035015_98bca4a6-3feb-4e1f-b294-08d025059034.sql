
-- Fix 1: Drop the old anon policy that was re-created by a previous migration
DROP POLICY IF EXISTS "Anyone can view invoices by direct link" ON public.invoices;

-- Fix 2: Enable RLS on pricing_packages and landing_content
ALTER TABLE public.pricing_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;
