-- Create function to set configuration for RLS
CREATE OR REPLACE FUNCTION public.set_config(setting_name text, setting_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  PERFORM set_config(setting_name, setting_value, false);
END;
$function$;