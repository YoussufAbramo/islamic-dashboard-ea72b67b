-- Add scheduled_time column (HH:MM format, default 02:00 = 2 AM)
ALTER TABLE public.auto_backup_config
ADD COLUMN IF NOT EXISTS scheduled_time text NOT NULL DEFAULT '02:00';

-- Enable pg_cron and pg_net extensions for scheduled HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;