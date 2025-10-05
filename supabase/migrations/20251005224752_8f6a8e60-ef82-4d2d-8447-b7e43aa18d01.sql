-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Add reminder_type to notification_log to track which reminder was sent
ALTER TABLE notification_log 
ADD COLUMN IF NOT EXISTS reminder_type text CHECK (reminder_type IN ('24h', '2h'));

-- Create cron job to send 24-hour reminders (runs every hour)
SELECT cron.schedule(
  'send-24h-shift-reminders',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url:='https://xifveewakokjugldqqaz.supabase.co/functions/v1/send-shift-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZnZlZXdha29ranVnbGRxcWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNTc1NTcsImV4cCI6MjA2NjYzMzU1N30.UBA6lgEbTi0mzO-eK3r9DHSsdB-jGukoKjSBFWwym6A"}'::jsonb,
    body:='{"reminder_type": "24h"}'::jsonb
  ) as request_id;
  $$
);

-- Create cron job to send 2-hour reminders (runs every 30 minutes)
SELECT cron.schedule(
  'send-2h-shift-reminders',
  '*/30 * * * *', -- Every 30 minutes
  $$
  SELECT net.http_post(
    url:='https://xifveewakokjugldqqaz.supabase.co/functions/v1/send-shift-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZnZlZXdha29ranVnbGRxcWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNTc1NTcsImV4cCI6MjA2NjYzMzU1N30.UBA6lgEbTi0mzO-eK3r9DHSsdB-jGukoKjSBFWwym6A"}'::jsonb,
    body:='{"reminder_type": "2h"}'::jsonb
  ) as request_id;
  $$
);