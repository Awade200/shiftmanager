-- Drop existing RLS policies that rely on auth.uid()
DROP POLICY IF EXISTS "Users can view own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Users can create own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Users can update own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Users can delete own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Admins can manage all shifts" ON public.shifts;

-- Create new RLS policies that work with mobile authentication
-- Allow all operations for users based on mobile_number matching
CREATE POLICY "Mobile users can manage own shifts" 
ON public.shifts 
FOR ALL 
USING (mobile_number = current_setting('app.current_mobile_number', true))
WITH CHECK (mobile_number = current_setting('app.current_mobile_number', true));

-- Allow reading shifts for mobile users
CREATE POLICY "Mobile users can view own shifts" 
ON public.shifts 
FOR SELECT 
USING (mobile_number = current_setting('app.current_mobile_number', true));

-- Temporary policy to allow all operations during development
CREATE POLICY "Allow all operations during development" 
ON public.shifts 
FOR ALL 
USING (true)
WITH CHECK (true);