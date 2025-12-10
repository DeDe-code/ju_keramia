-- Fix Hero Images RLS Policies
-- Issue: Previous policy allowed ANY authenticated user to manage hero images
-- Solution: Restrict management to specific admin user(s)

-- Drop existing overly permissive policy
drop policy if exists "Admins can manage hero images" on public.hero_images;

-- Ensure RLS is enabled (should already be enabled from migration 006)
alter table public.hero_images enable row level security;

-- Public read access (unchanged - hero images should be publicly visible)
-- This policy already exists from migration 006, but we'll ensure it's correct
drop policy if exists "Hero images are publicly readable" on public.hero_images;
create policy "Hero images are publicly readable"
    on public.hero_images for select
    to public
    using (true);

-- Create helper function to check if user is admin
-- This checks if the authenticated user's email matches the admin email from auth.users
create or replace function public.is_admin()
returns boolean as $$
begin
    -- Check if current user exists and has authenticated session
    if auth.uid() is null then
        return false;
    end if;
    
    -- Option 1: Check against specific admin email(s)
    -- Replace 'jukeramia@gmail.com' with your actual admin email
    return exists (
        select 1 
        from auth.users 
        where id = auth.uid() 
        and email in ('jukeramia@gmail.com')
    );
    
    -- Option 2 (Alternative): Use user metadata 'is_admin' flag
    -- Uncomment below and comment out Option 1 if you want to use metadata approach
    /*
    return exists (
        select 1 
        from auth.users 
        where id = auth.uid() 
        and (raw_user_meta_data->>'is_admin')::boolean = true
    );
    */
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function public.is_admin() to authenticated;

-- Admin-only policies for INSERT, UPDATE, DELETE
create policy "Only admins can insert hero images"
    on public.hero_images for insert
    to authenticated
    with check (public.is_admin());

create policy "Only admins can update hero images"
    on public.hero_images for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

create policy "Only admins can delete hero images"
    on public.hero_images for delete
    to authenticated
    using (public.is_admin());

-- Add comment for documentation
comment on function public.is_admin() is 
    'Helper function to check if current authenticated user is an admin. Returns true if user email matches admin email(s).';

-- Security notes:
-- 1. The is_admin() function is marked 'security definer' to run with creator privileges
-- 2. This allows checking auth.users table even if the caller doesn't have direct access
-- 3. The function only returns boolean, preventing data leakage
-- 4. To add more admins, update the email list in the is_admin() function
-- 5. Alternative: Use Supabase Dashboard to set 'is_admin' flag in user metadata
