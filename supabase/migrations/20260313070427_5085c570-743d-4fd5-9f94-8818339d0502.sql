-- Reschedule cron job with x-backup-secret header for authentication
SELECT cron.unschedule('auto-backup-hourly');

SELECT cron.schedule(
  'auto-backup-hourly',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://ubpiluthfipkunectidq.supabase.co/functions/v1/manage-backups',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVicGlsdXRoZmlwa3VuZWN0aWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjkyODksImV4cCI6MjA4ODYwNTI4OX0.t5ebTVWuO1X_0KBF6-XhnF5d4tiBS3TTKpVzFT4P4hc", "x-backup-secret": "54b86103-ab0e-413d-bc40-1d8ae3145987"}'::jsonb,
        body:='{"action": "run_auto_backup"}'::jsonb
    ) AS request_id;
  $$
);