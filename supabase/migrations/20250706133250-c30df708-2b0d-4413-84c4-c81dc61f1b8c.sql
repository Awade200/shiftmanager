-- Temporarily allow development mode for shifts table
-- This will allow the mock user ID to work during development

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Users can create their own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Users can update their own shifts" ON public.shifts;
DROP POLICY IF EXISTS "Users can delete their own shifts" ON public.shifts;

-- Create development-friendly policies
CREATE POLICY "Dev: Allow all operations on shifts" 
ON public.shifts 
FOR ALL 
USING (true) 
WITH CHECK (true);