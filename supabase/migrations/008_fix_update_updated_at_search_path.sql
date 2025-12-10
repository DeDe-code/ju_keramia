-- Fix security vulnerability: Set immutable search_path for update_updated_at_column function
-- This prevents search_path poisoning attacks where malicious schemas could override pg_catalog functions

-- Drop and recreate the function with proper security settings
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
SECURITY INVOKER
AS $$
BEGIN
    -- Explicitly use pg_catalog.now() to prevent schema poisoning
    NEW.updated_at = pg_catalog.now();
    RETURN NEW;
END;
$$;

-- Recreate the trigger for hero_images table
CREATE TRIGGER update_hero_images_updated_at
    BEFORE UPDATE ON public.hero_images
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment explaining the security configuration
COMMENT ON FUNCTION public.update_updated_at_column() IS 
'Trigger function to update updated_at timestamp. Uses fixed search_path (pg_catalog, public) to prevent search_path poisoning attacks.';
