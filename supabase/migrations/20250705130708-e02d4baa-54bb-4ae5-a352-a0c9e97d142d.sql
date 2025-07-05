-- Create shifts table for storing shift data
CREATE TABLE public.shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  client_name TEXT NOT NULL,
  location TEXT,
  hourly_rate DECIMAL(10,2) NOT NULL,
  duration DECIMAL(5,2) NOT NULL,
  earnings DECIMAL(10,2) NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own shifts" 
ON public.shifts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shifts" 
ON public.shifts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shifts" 
ON public.shifts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shifts" 
ON public.shifts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_shifts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_shifts_updated_at
BEFORE UPDATE ON public.shifts
FOR EACH ROW
EXECUTE FUNCTION public.update_shifts_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_shifts_user_id ON public.shifts(user_id);
CREATE INDEX idx_shifts_date ON public.shifts(date DESC);
CREATE INDEX idx_shifts_user_date ON public.shifts(user_id, date DESC);