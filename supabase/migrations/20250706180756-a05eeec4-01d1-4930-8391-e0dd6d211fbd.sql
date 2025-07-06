-- Create client_profiles table for auto-learning client-location mappings
CREATE TABLE public.client_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL UNIQUE,
  default_location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for client profiles access
CREATE POLICY "Users can view all client profiles" 
ON public.client_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create client profiles" 
ON public.client_profiles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update client profiles" 
ON public.client_profiles 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete client profiles" 
ON public.client_profiles 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_client_profiles_updated_at
BEFORE UPDATE ON public.client_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster client name lookups
CREATE INDEX idx_client_profiles_client_name ON public.client_profiles(client_name);
CREATE INDEX idx_client_profiles_client_name_lower ON public.client_profiles(LOWER(client_name));