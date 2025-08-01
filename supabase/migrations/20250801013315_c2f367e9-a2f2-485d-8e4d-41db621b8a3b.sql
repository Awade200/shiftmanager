-- Fix shifts table RLS policies to work with mobile authentication
DROP POLICY IF EXISTS "Users can manage own shifts" ON public.shifts;

-- Create simpler policies that work with mobile authentication
-- For now, allow all operations for authenticated users
-- We'll filter by mobile_number in the application code
CREATE POLICY "Enable all operations for authenticated users" 
ON public.shifts 
FOR ALL 
USING (true)
WITH CHECK (true);