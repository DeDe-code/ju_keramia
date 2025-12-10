-- Fix Products RLS Policies
-- Issue: Migration 007 allowed ANY authenticated user to manage products
-- Solution: Restrict management to admin users only

-- Drop existing overly permissive policies from migration 007
drop policy if exists "Authenticated users can insert products" on public.products;
drop policy if exists "Authenticated users can update products" on public.products;
drop policy if exists "Authenticated users can delete products" on public.products;

-- Ensure RLS is enabled (should already be from migration 003)
alter table public.products enable row level security;

-- Public read access (unchanged - products should be publicly visible)
-- This policy already exists from migration 003, ensuring it remains
drop policy if exists "Anyone can view products" on public.products;
create policy "Anyone can view products"
    on public.products for select
    to public
    using (true);

-- Admin-only policies for INSERT, UPDATE, DELETE using the is_admin() function
-- Note: The is_admin() function is created in migration 009_fix_hero_images_rls.sql

create policy "Only admins can insert products"
    on public.products for insert
    to authenticated
    with check (public.is_admin());

create policy "Only admins can update products"
    on public.products for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

create policy "Only admins can delete products"
    on public.products for delete
    to authenticated
    using (public.is_admin());

-- Security notes:
-- 1. Uses the is_admin() helper function from migration 009
-- 2. Only authenticated users matching admin email can manage products
-- 3. Public users can still view products (for shop page)
-- 4. To add more admins, update the is_admin() function in migration 009
