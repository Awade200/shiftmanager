-- Temporarily disable RLS on mobile_auth to allow signup
ALTER TABLE public.mobile_auth DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.mobile_auth ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow anyone to signup" ON public.mobile_auth;
DROP POLICY IF EXISTS "Users can view own mobile auth" ON public.mobile_auth;
DROP POLICY IF EXISTS "Users can update own mobile auth" ON public.mobile_auth;

-- Create simple policies that work for anonymous users
CREATE POLICY "Enable insert for all users" 
ON public.mobile_auth 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable select for all users" 
ON public.mobile_auth 
FOR SELECT 
USING (true);

CREATE POLICY "Enable update for all users" 
ON public.mobile_auth 
FOR UPDATE 
USING (true);