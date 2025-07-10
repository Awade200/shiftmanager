-- Add shift_key column to shifts table for duplicate detection
ALTER TABLE public.shifts 
ADD COLUMN shift_key TEXT;

-- Create index for fast lookups
CREATE INDEX idx_shifts_key ON public.shifts(shift_key);

-- Update existing records to populate shift_key
UPDATE public.shifts 
SET shift_key = LOWER(date::text || '_' || REPLACE(client_name, ' ', '_'))
WHERE shift_key IS NULL;

-- Make shift_key not null after populating existing data
ALTER TABLE public.shifts 
ALTER COLUMN shift_key SET NOT NULL;