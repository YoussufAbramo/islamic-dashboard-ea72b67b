-- Create ebooks table
CREATE TABLE public.ebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_ar text DEFAULT '',
  description text DEFAULT '',
  description_ar text DEFAULT '',
  cover_url text DEFAULT '',
  pdf_url text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;

-- Admin can manage ebooks
CREATE POLICY "Admins can manage ebooks"
  ON public.ebooks FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can view ebooks
CREATE POLICY "All authenticated can view ebooks"
  ON public.ebooks FOR SELECT
  TO authenticated
  USING (true);

-- Create storage bucket for ebooks
INSERT INTO storage.buckets (id, name, public)
VALUES ('ebooks', 'ebooks', true);

-- Storage policies for ebooks bucket
CREATE POLICY "Admins can upload ebooks"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ebooks' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ebooks"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ebooks' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ebooks"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ebooks' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view ebooks"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'ebooks');