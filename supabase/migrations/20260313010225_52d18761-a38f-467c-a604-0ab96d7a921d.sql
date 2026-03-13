-- Fix missing EXECUTE grant on has_role function
-- This was lost during a previous migration that recreated the function
-- Without this grant, all RLS policies using has_role() silently fail
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;