
-- Create a security definer function to check chat membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_chat_member(_user_id uuid, _chat_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE user_id = _user_id AND chat_id = _chat_id
  )
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Members can view chat members" ON public.chat_members;

-- Recreate it using the security definer function
CREATE POLICY "Members can view chat members"
ON public.chat_members
FOR SELECT
TO authenticated
USING (public.is_chat_member(auth.uid(), chat_id));
