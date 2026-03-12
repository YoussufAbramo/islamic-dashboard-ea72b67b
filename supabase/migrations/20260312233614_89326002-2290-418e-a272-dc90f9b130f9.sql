-- Add gender and date_of_birth columns to teachers table
ALTER TABLE public.teachers ADD COLUMN gender text DEFAULT NULL;
ALTER TABLE public.teachers ADD COLUMN date_of_birth date DEFAULT NULL;