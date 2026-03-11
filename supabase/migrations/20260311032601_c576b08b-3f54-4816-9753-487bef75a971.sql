-- Schedule daily auto-invoice generation at 6:00 AM UTC
SELECT cron.schedule(
  'daily-auto-invoice',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ubpiluthfipkunectidq.supabase.co/functions/v1/auto-invoice',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVicGlsdXRoZmlwa3VuZWN0aWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjkyODksImV4cCI6MjA4ODYwNTI4OX0.t5ebTVWuO1X_0KBF6-XhnF5d4tiBS3TTKpVzFT4P4hc"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);