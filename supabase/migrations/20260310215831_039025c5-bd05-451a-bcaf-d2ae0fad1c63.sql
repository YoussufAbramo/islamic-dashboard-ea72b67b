-- Re-grant EXECUTE on RLS helper functions to authenticated users.
-- These SECURITY DEFINER functions are required by RLS policies across
-- multiple tables (user_roles, storage, payment_gateway_config, etc.).
-- Without EXECUTE permission, all RLS policy evaluations that reference
-- these functions fail, breaking queries for authenticated users.

GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;