-- Add day_date column to notification_log table for tracking day-based notifications
ALTER TABLE public.notification_log
ADD COLUMN day_date date;

-- Add index for better query performance on day-based lookups
CREATE INDEX idx_notification_log_day_date ON public.notification_log(mobile_number, day_date, reminder_type);

-- Add comment to explain the column
COMMENT ON COLUMN public.notification_log.day_date IS 'Date of the day for which the notification was sent (for day-based notifications)';