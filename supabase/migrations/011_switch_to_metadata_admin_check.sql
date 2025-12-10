-- Switch to User Metadata-Based Admin Check
-- This migration updates the admin verification system from email whitelist to user metadata
-- Following industry standard RBAC practices

-- Step 1: Update is_admin() function to check metadata instead of email
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;
    
    -- Primary check: user metadata is_admin flag
    -- This is the industry standard approach for RBAC
    IF EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = auth.uid() 
        AND (raw_user_meta_data->>'is_admin')::boolean = true
    ) THEN
        RETURN true;
    END IF;
    
    -- Fallback check: email whitelist for emergency access
    -- Keep this as a safety measure in case metadata is accidentally cleared
    IF EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = auth.uid() 
        AND email IN ('jukeramia@gmail.com')
    ) THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Set admin flag for existing admin user(s)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{is_admin}',
    'true'::jsonb
)
WHERE email = 'jukeramia@gmail.com';

-- Step 3: Create helper function to grant admin privileges
CREATE OR REPLACE FUNCTION public.grant_admin(user_email text)
RETURNS jsonb AS $$
DECLARE
    affected_rows int;
BEGIN
    -- Only existing admins can grant admin access
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Permission denied: Only admins can grant admin privileges';
    END IF;
    
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
        RAISE EXCEPTION 'User with email % does not exist', user_email;
    END IF;
    
    -- Grant admin access
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{is_admin}',
        'true'::jsonb
    )
    WHERE email = user_email;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Admin access granted to %s', user_email),
        'affected_rows', affected_rows
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create helper function to revoke admin privileges
CREATE OR REPLACE FUNCTION public.revoke_admin(user_email text)
RETURNS jsonb AS $$
DECLARE
    affected_rows int;
    admin_count int;
BEGIN
    -- Only existing admins can revoke admin access
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Permission denied: Only admins can revoke admin privileges';
    END IF;
    
    -- Count current admins
    SELECT COUNT(*) INTO admin_count
    FROM auth.users 
    WHERE (raw_user_meta_data->>'is_admin')::boolean = true;
    
    -- Prevent removing the last admin
    IF admin_count <= 1 THEN
        RAISE EXCEPTION 'Cannot remove the last admin user';
    END IF;
    
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
        RAISE EXCEPTION 'User with email % does not exist', user_email;
    END IF;
    
    -- Revoke admin access
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{is_admin}',
        'false'::jsonb
    )
    WHERE email = user_email;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Admin access revoked from %s', user_email),
        'affected_rows', affected_rows
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create view to list all admins (admin-only access)
CREATE OR REPLACE VIEW public.admin_users AS
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    (raw_user_meta_data->>'is_admin')::boolean as is_admin,
    CASE 
        WHEN email IN ('jukeramia@gmail.com') THEN true
        ELSE false
    END as has_emergency_access
FROM auth.users
WHERE (raw_user_meta_data->>'is_admin')::boolean = true
ORDER BY created_at;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin(text) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.is_admin() IS 
    'Checks if current user has admin privileges. Uses user_metadata.is_admin flag with email whitelist fallback for emergency access.';

COMMENT ON FUNCTION public.grant_admin(text) IS 
    'Grants admin privileges to a user by email. Can only be called by existing admins. Usage: SELECT grant_admin(''user@example.com'');';

COMMENT ON FUNCTION public.revoke_admin(text) IS 
    'Revokes admin privileges from a user by email. Can only be called by existing admins. Prevents removing the last admin. Usage: SELECT revoke_admin(''user@example.com'');';

COMMENT ON VIEW public.admin_users IS 
    'Lists all users with admin privileges, including emergency access flags.';

-- Verification query (run this after migration to verify)
-- SELECT * FROM public.admin_users;
-- SELECT public.is_admin();
