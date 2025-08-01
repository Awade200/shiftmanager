-- Add mobile authentication table
CREATE TABLE public.mobile_auth (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mobile_number text NOT NULL UNIQUE,
  pin_hash text NOT NULL,
  display_name text NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_login timestamp with time zone
);

-- Enable RLS on mobile_auth table
ALTER TABLE public.mobile_auth ENABLE ROW LEVEL SECURITY;

-- Create policies for mobile_auth
CREATE POLICY "Users can view own mobile auth" 
ON public.mobile_auth 
FOR SELECT 
USING (mobile_number = current_setting('app.current_mobile_number', true));

CREATE POLICY "Allow mobile auth signup" 
ON public.mobile_auth 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update own mobile auth" 
ON public.mobile_auth 
FOR UPDATE 
USING (mobile_number = current_setting('app.current_mobile_number', true));

-- Update profiles table to reference mobile_auth instead of auth.users
ALTER TABLE public.profiles 
ADD COLUMN mobile_number text REFERENCES public.mobile_auth(mobile_number) ON DELETE CASCADE;

-- Update shifts table to use mobile_number instead of user_id
ALTER TABLE public.shifts 
ADD COLUMN mobile_number text REFERENCES public.mobile_auth(mobile_number) ON DELETE CASCADE;

-- Create RLS policies for shifts using mobile number
DROP POLICY IF EXISTS "Admin can manage shifts" ON public.shifts;

CREATE POLICY "Users can manage own shifts" 
ON public.shifts 
FOR ALL
USING (mobile_number = current_setting('app.current_mobile_number', true));

-- Update profiles RLS policies
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;

CREATE POLICY "Users can manage own profile" 
ON public.profiles 
FOR ALL
USING (mobile_number = current_setting('app.current_mobile_number', true));

-- Add trigger for mobile_auth updated_at
CREATE TRIGGER update_mobile_auth_updated_at
BEFORE UPDATE ON public.mobile_auth
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();