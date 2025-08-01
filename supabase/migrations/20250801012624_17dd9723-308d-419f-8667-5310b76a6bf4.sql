-- Update mobile_auth policies to allow proper signup
DROP POLICY IF EXISTS "Allow mobile auth signup" ON public.mobile_auth;
DROP POLICY IF EXISTS "Users can view own mobile auth" ON public.mobile_auth;
DROP POLICY IF EXISTS "Users can update own mobile auth" ON public.mobile_auth;

-- Create new policies that work properly for mobile auth
CREATE POLICY "Allow anyone to signup" 
ON public.mobile_auth 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view own mobile auth" 
ON public.mobile_auth 
FOR SELECT 
USING (mobile_number = current_setting('app.current_mobile_number'::text, true));

CREATE POLICY "Users can update own mobile auth" 
ON public.mobile_auth 
FOR UPDATE 
USING (mobile_number = current_setting('app.current_mobile_number'::text, true));