
-- Fix 1: Remove admin role self-assignment via signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  
  -- Always assign 'student' role. Admin roles must be granted by an existing admin.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  -- Create student record
  INSERT INTO public.students (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Fix 2: Drop the anon policy that exposes all invoices
DROP POLICY IF EXISTS "Anyone can view invoices by direct link" ON public.invoices;

-- Fix 3: Make ebooks bucket private
UPDATE storage.buckets SET public = false WHERE id = 'ebooks';
