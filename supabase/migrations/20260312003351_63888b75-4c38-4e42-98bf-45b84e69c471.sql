
-- Support departments table
CREATE TABLE public.support_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Support priorities table
CREATE TABLE public.support_priorities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  color TEXT NOT NULL DEFAULT 'default',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.support_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_priorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage departments" ON public.support_departments
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read active departments" ON public.support_departments
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Admins can manage priorities" ON public.support_priorities
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read active priorities" ON public.support_priorities
  FOR SELECT TO anon USING (is_active = true);

-- Seed default departments
INSERT INTO public.support_departments (name, name_ar, sort_order) VALUES
  ('General', 'عام', 0),
  ('Technical', 'تقني', 1),
  ('Billing', 'الفواتير', 2),
  ('Academic', 'أكاديمي', 3);

-- Seed default priorities
INSERT INTO public.support_priorities (name, name_ar, color, sort_order) VALUES
  ('Low', 'منخفضة', 'secondary', 0),
  ('Medium', 'متوسطة', 'default', 1),
  ('High', 'عالية', 'destructive', 2),
  ('Urgent', 'عاجلة', 'destructive', 3);
