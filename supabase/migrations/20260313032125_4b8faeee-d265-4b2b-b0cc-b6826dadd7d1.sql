-- Remove old cron job and create new hourly one
SELECT cron.unschedule('auto-backup-daily');

SELECT cron.schedule(
  'auto-backup-hourly',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://ubpiluthfipkunectidq.supabase.co/functions/v1/manage-backups',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVicGlsdXRoZmlwa3VuZWN0aWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjkyODksImV4cCI6MjA4ODYwNTI4OX0.t5ebTVWuO1X_0KBF6-XhnF5d4tiBS3TTKpVzFT4P4hc"}'::jsonb,
        body:='{"action": "run_auto_backup"}'::jsonb
    ) AS request_id;
  $$
);