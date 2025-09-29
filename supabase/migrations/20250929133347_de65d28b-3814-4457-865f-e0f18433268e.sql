-- Create days table for Day-first architecture
CREATE TABLE public.days (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mobile_number text NOT NULL,
  day_date date NOT NULL,
  total_hours numeric DEFAULT 0,
  shift_count integer DEFAULT 0,
  has_conflicts boolean DEFAULT false,
  has_unresolved boolean DEFAULT false,
  last_import_session_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(mobile_number, day_date)
);

-- Create import_sessions table for tracking upload sessions
CREATE TABLE public.import_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mobile_number text NOT NULL,
  session_data jsonb,
  days_found integer DEFAULT 0,
  days_saved integer DEFAULT 0,
  days_skipped integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active'
);

-- Add day_id and status to shifts table
ALTER TABLE public.shifts 
ADD COLUMN day_id uuid REFERENCES public.days(id) ON DELETE CASCADE,
ADD COLUMN status text DEFAULT 'ready';

-- Enable RLS on new tables
ALTER TABLE public.days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for days table
CREATE POLICY "Allow all operations during development" 
ON public.days 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Mobile users can manage own days" 
ON public.days 
FOR ALL 
USING (mobile_number = current_setting('app.current_mobile_number', true)) 
WITH CHECK (mobile_number = current_setting('app.current_mobile_number', true));

-- Create policies for import_sessions table
CREATE POLICY "Allow all operations during development" 
ON public.import_sessions 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Mobile users can manage own sessions" 
ON public.import_sessions 
FOR ALL 
USING (mobile_number = current_setting('app.current_mobile_number', true)) 
WITH CHECK (mobile_number = current_setting('app.current_mobile_number', true));

-- Create function to update day statistics
CREATE OR REPLACE FUNCTION public.update_day_statistics()
RETURNS TRIGGER AS $$
DECLARE
  day_record RECORD;
BEGIN
  -- Get the day_id to update (from NEW if insert/update, OLD if delete)
  IF TG_OP = 'DELETE' THEN
    IF OLD.day_id IS NULL THEN
      RETURN OLD;
    END IF;
    
    -- Update statistics for the day
    UPDATE public.days 
    SET 
      total_hours = COALESCE((
        SELECT SUM(duration) 
        FROM public.shifts 
        WHERE day_id = OLD.day_id
      ), 0),
      shift_count = COALESCE((
        SELECT COUNT(*) 
        FROM public.shifts 
        WHERE day_id = OLD.day_id
      ), 0),
      has_unresolved = EXISTS(
        SELECT 1 
        FROM public.shifts 
        WHERE day_id = OLD.day_id 
        AND status != 'ready'
      ),
      updated_at = now()
    WHERE id = OLD.day_id;
    
    RETURN OLD;
  ELSE
    IF NEW.day_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Update statistics for the day
    UPDATE public.days 
    SET 
      total_hours = COALESCE((
        SELECT SUM(duration) 
        FROM public.shifts 
        WHERE day_id = NEW.day_id
      ), 0),
      shift_count = COALESCE((
        SELECT COUNT(*) 
        FROM public.shifts 
        WHERE day_id = NEW.day_id
      ), 0),
      has_unresolved = EXISTS(
        SELECT 1 
        FROM public.shifts 
        WHERE day_id = NEW.day_id 
        AND status != 'ready'
      ),
      updated_at = now()
    WHERE id = NEW.day_id;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update day statistics
CREATE TRIGGER update_day_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_day_statistics();

-- Create function to get or create day
CREATE OR REPLACE FUNCTION public.get_or_create_day(
  p_mobile_number text,
  p_day_date date
) RETURNS uuid AS $$
DECLARE
  day_id uuid;
BEGIN
  -- Try to get existing day
  SELECT id INTO day_id
  FROM public.days
  WHERE mobile_number = p_mobile_number
  AND day_date = p_day_date;
  
  -- If not found, create new day
  IF day_id IS NULL THEN
    INSERT INTO public.days (mobile_number, day_date)
    VALUES (p_mobile_number, p_day_date)
    RETURNING id INTO day_id;
  END IF;
  
  RETURN day_id;
END;
$$ LANGUAGE plpgsql;