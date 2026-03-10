
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('backups', 'backups', false, 104857600, ARRAY['application/json', 'text/csv', 'application/sql'])
ON CONFLICT (id) DO NOTHING;

-- Only admins can manage backups
CREATE POLICY "Admins can manage backups" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'backups' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'backups' AND public.has_role(auth.uid(), 'admin'));
