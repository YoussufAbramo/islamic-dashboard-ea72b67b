-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name text NOT NULL,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow insert from triggers (service role / security definer)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _old jsonb;
  _new jsonb;
  _changed text[];
  _key text;
BEGIN
  _user_id := auth.uid();

  IF TG_OP = 'DELETE' THEN
    _old := to_jsonb(OLD);
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (_user_id, 'DELETE', TG_TABLE_NAME, OLD.id::text, _old);
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    _new := to_jsonb(NEW);
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (_user_id, 'INSERT', TG_TABLE_NAME, NEW.id::text, _new);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    _old := to_jsonb(OLD);
    _new := to_jsonb(NEW);
    -- Calculate changed fields
    _changed := ARRAY(
      SELECT key FROM jsonb_each(_new) AS n(key, value)
      WHERE _old->>key IS DISTINCT FROM _new->>key
        AND key NOT IN ('updated_at', 'created_at')
    );
    -- Only log if there are meaningful changes
    IF array_length(_changed, 1) > 0 THEN
      INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data, changed_fields)
      VALUES (_user_id, 'UPDATE', TG_TABLE_NAME, NEW.id::text, _old, _new, _changed);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Attach triggers to key tables
CREATE TRIGGER audit_students AFTER INSERT OR UPDATE OR DELETE ON public.students FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_teachers AFTER INSERT OR UPDATE OR DELETE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_courses AFTER INSERT OR UPDATE OR DELETE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_subscriptions AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_certificates AFTER INSERT OR UPDATE OR DELETE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_announcements AFTER INSERT OR UPDATE OR DELETE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_support_tickets AFTER INSERT OR UPDATE OR DELETE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();