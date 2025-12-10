# Row Level Security (RLS) Configuration

## Overview

This document explains the Row Level Security (RLS) implementation for the Ju Keramia project, which restricts database access to authorized users only.

## Problem Statement

**Issue:** The `hero_images` and `products` tables had RLS enabled but with overly permissive policies that allowed **any authenticated user** to insert, update, or delete records.

**Risk:**

- Unauthorized data manipulation by any logged-in user
- No distinction between regular users and administrators
- Potential data loss or corruption
- Security vulnerability in multi-user scenarios

## Solution Architecture

### 1. Admin Verification Function

Created a reusable `is_admin()` function that checks if the current authenticated user is an administrator.

**Current Implementation:** `supabase/migrations/011_switch_to_metadata_admin_check.sql` (Recommended)

**⭐ User Metadata Approach (Industry Standard):**

```sql
create or replace function public.is_admin()
returns boolean as $$
begin
    if auth.uid() is null then
        return false;
    end if;

    -- Primary: Check user metadata
    if exists (
        select 1
        from auth.users
        where id = auth.uid()
        and (raw_user_meta_data->>'is_admin')::boolean = true
    ) then
        return true;
    end if;

    -- Fallback: Email whitelist for emergency access
    if exists (
        select 1
        from auth.users
        where id = auth.uid()
        and email in ('jukeramia@gmail.com')
    ) then
        return true;
    end if;

    return false;
end;
$$ language plpgsql security definer;
```

**Key Features:**

- ✅ **Security Definer**: Runs with creator privileges to access `auth.users`
- ✅ **Session Check**: Returns `false` for unauthenticated requests
- ✅ **User Metadata**: Checks `is_admin` flag (industry standard RBAC)
- ✅ **Email Fallback**: Emergency access via email whitelist
- ✅ **Returns Boolean Only**: Prevents data leakage

**Admin Management Functions:**

```sql
-- Grant admin access (admin-only)
SELECT grant_admin('newadmin@example.com');

-- Revoke admin access (admin-only)
SELECT revoke_admin('user@example.com');

-- List all admins
SELECT * FROM admin_users;
```

📚 **See:** `docs/METADATA_ADMIN_MIGRATION.md` for complete guide

### 2. RLS Policy Structure

Each table has four types of policies:

#### Public Read Access (SELECT)

```sql
create policy "Hero images are publicly readable"
    on public.hero_images for select
    to public
    using (true);
```

**Purpose:** Allows anyone (authenticated or not) to view hero images for the landing/about pages.

#### Admin-Only Insert (INSERT)

```sql
create policy "Only admins can insert hero images"
    on public.hero_images for insert
    to authenticated
    with check (public.is_admin());
```

**Purpose:** Only admin users can upload new hero images.

#### Admin-Only Update (UPDATE)

```sql
create policy "Only admins can update hero images"
    on public.hero_images for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());
```

**Purpose:** Only admin users can modify existing hero images.

#### Admin-Only Delete (DELETE)

```sql
create policy "Only admins can delete hero images"
    on public.hero_images for delete
    to authenticated
    using (public.is_admin());
```

**Purpose:** Only admin users can remove hero images.

## Protected Tables

### 1. `hero_images` Table

**Migration:** `009_fix_hero_images_rls.sql`

**Policies:**

- ✅ Public read access (for landing/about pages)
- ✅ Admin-only insert, update, delete
- ✅ RLS enabled

**Use Case:** Admin dashboard hero image management

### 2. `products` Table

**Migration:** `010_fix_products_rls.sql`

**Policies:**

- ✅ Public read access (for shop page)
- ✅ Admin-only insert, update, delete
- ✅ RLS enabled

**Use Case:** Admin dashboard product catalog management

### 3. `orders` Table

**Migration:** `004_orders_rls.sql`

**Policies:**

- ✅ Users can view their own orders
- ✅ Admins can view all orders
- ✅ Users can insert orders
- ✅ Admins can update/delete orders

**Note:** This table has more complex policies for customer order management (future feature).

## Admin User Management

### Current Setup: Email Whitelist

The `is_admin()` function checks against a hardcoded list of admin emails:

```sql
email in ('jukeramia@gmail.com')
```

### Adding More Admins

**Method 1: Update the SQL Function (Recommended for Production)**

1. Create a new migration:

   ```bash
   # Example: supabase/migrations/011_add_admin_user.sql
   ```

2. Add the new admin email:

   ```sql
   create or replace function public.is_admin()
   returns boolean as $$
   begin
       if auth.uid() is null then
           return false;
       end if;

       return exists (
           select 1
           from auth.users
           where id = auth.uid()
           and email in (
               'jukeramia@gmail.com',
               'admin2@example.com',  -- New admin
               'admin3@example.com'   -- Another admin
           )
       );
   end;
   $$ language plpgsql security definer;
   ```

3. Run the migration:
   ```bash
   supabase db push
   ```

**Method 2: User Metadata Flag (Alternative)**

If you prefer a more flexible approach:

1. Update the `is_admin()` function to check user metadata:

   ```sql
   create or replace function public.is_admin()
   returns boolean as $$
   begin
       if auth.uid() is null then
           return false;
       end if;

       return exists (
           select 1
           from auth.users
           where id = auth.uid()
           and (raw_user_meta_data->>'is_admin')::boolean = true
       );
   end;
   $$ language plpgsql security definer;
   ```

2. Set the admin flag via Supabase Dashboard:
   - Navigate to **Authentication** → **Users**
   - Click on a user
   - Edit **User Metadata**
   - Add: `{ "is_admin": true }`

3. Or programmatically:
   ```typescript
   await supabase.auth.admin.updateUserById(userId, {
     user_metadata: { is_admin: true },
   });
   ```

**Pros/Cons:**

| Method              | Pros                                             | Cons                                                                                    |
| ------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| **Email Whitelist** | - Simple<br>- Explicit<br>- Version controlled   | - Requires migration for changes<br>- Not dynamic                                       |
| **Metadata Flag**   | - Dynamic<br>- No migration needed<br>- Flexible | - Less explicit<br>- Can be changed via API<br>- Requires careful permission management |

## Testing RLS Policies

### Test 1: Public Read Access

```bash
# Test: Anyone can view hero images
curl https://your-project.supabase.co/rest/v1/hero_images \
  -H "apikey: your-anon-key"

# Expected: ✅ Success - returns hero images
```

### Test 2: Non-Admin Write Attempt

```bash
# Test: Non-admin user cannot insert hero image
curl -X POST https://your-project.supabase.co/rest/v1/hero_images \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer non-admin-token" \
  -H "Content-Type: application/json" \
  -d '{"page_type":"landing","image_url":"test.jpg","alt_text":"Test"}'

# Expected: ❌ Error 403 - "new row violates row-level security policy"
```

### Test 3: Admin Write Success

```bash
# Test: Admin user can insert hero image
curl -X POST https://your-project.supabase.co/rest/v1/hero_images \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"page_type":"landing","image_url":"test.jpg","alt_text":"Test"}'

# Expected: ✅ Success - inserts hero image
```

### Test 4: Admin Check Function

```sql
-- Test the is_admin() function in Supabase SQL Editor
-- Must be run while authenticated as an admin user
select public.is_admin();

-- Expected for admin: true
-- Expected for non-admin: false
```

## Application Integration

### Client-Side (No Changes Required)

The existing admin dashboard code works without modification:

```typescript
// composables/useImageUpload.ts
const { data, error } = await supabase
  .from('hero_images')
  .insert({ page_type: 'landing', ... });

// RLS automatically blocks non-admin users
// Error handling already in place
```

### Server-Side API Routes

API routes use server-side Supabase client with session cookies:

```typescript
// server/api/admin/upload-url.post.ts
const supabase = getSupabaseServer();

// Session is validated via cookies
// RLS policies apply based on authenticated user
```

**No code changes needed** - RLS policies enforce security at the database level.

## Security Best Practices

### ✅ Implemented

1. **RLS Enabled**: All sensitive tables have RLS enabled
2. **Principle of Least Privilege**: Only admins can modify data
3. **Defense in Depth**: Database-level security (not just app-level)
4. **Security Definer Functions**: Controlled access to auth.users
5. **Public Read Access**: Hero images and products are publicly viewable (as intended)

### 🔒 Additional Recommendations

1. **Enable Supabase Realtime Auth**: Ensure realtime subscriptions respect RLS

   ```sql
   alter publication supabase_realtime add table hero_images;
   ```

2. **Audit Logging**: Track admin actions

   ```sql
   create table admin_audit_log (
     id uuid primary key default gen_random_uuid(),
     user_id uuid references auth.users(id),
     action text,
     table_name text,
     record_id uuid,
     timestamp timestamp with time zone default now()
   );
   ```

3. **Rate Limiting**: Add rate limits to admin API endpoints (already done via Nuxt)

4. **IP Whitelisting** (Production): Restrict admin panel access by IP
   ```typescript
   // server/middleware/admin-ip-check.ts
   const allowedIPs = ['1.2.3.4', '5.6.7.8'];
   if (!allowedIPs.includes(clientIP)) {
     throw createError({ statusCode: 403 });
   }
   ```

## Troubleshooting

### Issue: "new row violates row-level security policy"

**Cause:** User is not authenticated as an admin

**Solution:**

1. Verify user is logged in via `/api/auth/me`
2. Check if user email matches admin whitelist
3. Confirm session tokens are valid (not expired)

### Issue: Admin can't upload images after migration

**Cause:** Policies may not have been applied correctly

**Solution:**

```sql
-- Check if policies exist
select * from pg_policies where tablename = 'hero_images';

-- Check if RLS is enabled
select relname, relrowsecurity
from pg_class
where relname = 'hero_images';

-- Manually re-run migration if needed
\i supabase/migrations/009_fix_hero_images_rls.sql
```

### Issue: is_admin() returns false for admin user

**Cause:** Email mismatch or auth context issue

**Solution:**

```sql
-- Verify user email in database
select id, email from auth.users;

-- Test admin check manually
select
    auth.uid() as current_user_id,
    (select email from auth.users where id = auth.uid()) as current_email,
    public.is_admin() as is_admin_result;
```

## Migration Checklist

When deploying to production:

- [ ] Update admin email in `009_fix_hero_images_rls.sql`
- [ ] Run all migrations: `supabase db push`
- [ ] Verify RLS is enabled: Check Supabase Dashboard → Database → Tables
- [ ] Test admin login and image upload
- [ ] Test product creation/editing
- [ ] Verify public can view images/products but not modify
- [ ] Document admin email(s) in secure location
- [ ] Set up monitoring/alerting for RLS policy violations

## Related Files

- `supabase/migrations/003_products_rls.sql` - Original products RLS (public read)
- `supabase/migrations/004_orders_rls.sql` - Orders RLS (user-specific)
- `supabase/migrations/006-hero_images_rls.sql` - Original hero images RLS (too permissive)
- `supabase/migrations/007_products_admin_policies.sql` - Original products admin (too permissive)
- `supabase/migrations/009_fix_hero_images_rls.sql` - ✅ Fixed hero images RLS
- `supabase/migrations/010_fix_products_rls.sql` - ✅ Fixed products RLS

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
