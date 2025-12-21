# RLS Security Migration - Quick Start Guide

## 🚨 Critical Security Fix

**Issue:** Database tables `hero_images` and `products` had overly permissive RLS policies allowing ANY authenticated user to modify data.

**Solution:** Restrict write access to admin users only via email whitelist.

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Update Admin Email

Edit the admin email in the migration file:

```bash
# Open the migration file
nano supabase/migrations/009_fix_hero_images_rls.sql

# Find this line (around line 30):
and email in ('jukeramia@gmail.com')

# Replace with your admin email:
and email in ('your-admin@example.com')

# Save and exit (Ctrl+X, Y, Enter)
```

### Step 2: Apply Migrations

**Option A: Automated Script (Recommended)**

```bash
# Make script executable
chmod +x scripts/apply-rls-migration.sh

# Run the script
./scripts/apply-rls-migration.sh
```

**Option B: Manual**

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push
```

### Step 3: Verify

Test the security:

1. ✅ Login as admin → Upload hero image → Should succeed
2. ✅ View products page → Should see products (public access)
3. ❌ Try to insert via API with wrong user → Should fail with 403

---

## 📋 What Changed

### Before (INSECURE ❌)

```sql
-- ANY authenticated user could modify data
create policy "Admins can manage hero images"
    on public.hero_images for all
    to authenticated
    using (true)  -- ⚠️ Too permissive!
```

### After (SECURE ✅)

```sql
-- Only specific admin email(s) can modify data
create policy "Only admins can insert hero images"
    on public.hero_images for insert
    to authenticated
    with check (public.is_admin());  -- ✅ Checks email whitelist
```

---

## 🔐 Security Features

### Admin Verification Function

```sql
create function public.is_admin()
returns boolean as $$
begin
    return exists (
        select 1 from auth.users
        where id = auth.uid()
        and email in ('your-admin@example.com')
    );
end;
$$ language plpgsql security definer;
```

### Protected Operations

| Table         | Public Read | Admin Write       |
| ------------- | ----------- | ----------------- |
| `hero_images` | ✅ Yes      | ✅ Email-verified |
| `products`    | ✅ Yes      | ✅ Email-verified |

---

## 🛠️ Adding More Admins

### Method 1: Update SQL Function

1. Create new migration:

   ```bash
   # Example: supabase/migrations/011_add_admin.sql
   ```

2. Update the function:

   ```sql
   create or replace function public.is_admin()
   returns boolean as $$
   begin
       return exists (
           select 1 from auth.users
           where id = auth.uid()
           and email in (
               'admin1@example.com',
               'admin2@example.com',
               'admin3@example.com'
           )
       );
   end;
   $$ language plpgsql security definer;
   ```

3. Apply:
   ```bash
   supabase db push
   ```

### Method 2: User Metadata (Alternative)

See full documentation in `docs/RLS_SECURITY.md`

---

## ✅ Testing Checklist

After migration, verify these scenarios:

### Admin User (Should Succeed ✅)

```bash
# Login as admin
curl -X POST https://your-project.supabase.co/auth/v1/token \
  -d '{"email":"admin@example.com","password":"password"}'

# Upload hero image
curl -X POST https://your-project.supabase.co/rest/v1/hero_images \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"page_type":"landing","image_url":"test.jpg",...}'

# Expected: ✅ 201 Created
```

### Non-Admin User (Should Fail ❌)

```bash
# Try to upload with different user
curl -X POST https://your-project.supabase.co/rest/v1/hero_images \
  -H "Authorization: Bearer <non-admin-token>" \
  -d '{"page_type":"landing","image_url":"test.jpg",...}'

# Expected: ❌ 403 Forbidden
# Error: "new row violates row-level security policy"
```

### Public Access (Should Succeed ✅)

```bash
# View products (no auth required)
curl https://your-project.supabase.co/rest/v1/products

# Expected: ✅ 200 OK with product list
```

---

## 🔍 Troubleshooting

### "Policy violation" error for admin

**Solution:** Check admin email matches database

```sql
-- Run in Supabase SQL Editor
select email from auth.users;  -- Verify your admin email
select public.is_admin();      -- Test function (should return true)
```

### Migrations already applied

**Solution:** Skip already-applied migrations

```bash
# Check migration status
supabase migration list

# Manually apply specific migration
supabase db execute < supabase/migrations/009_fix_hero_images_rls.sql
```

### Cannot connect to Supabase

**Solution:** Login and link project

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

---

## 📚 Documentation

- **Full Security Guide:** `docs/RLS_SECURITY.md`
- **Password Security:** `docs/PASSWORD_LEAK_CHECK.md`
- **Migration Files:**
  - `009_fix_hero_images_rls.sql` - Hero images security
  - `010_fix_products_rls.sql` - Products security

---

## 🚀 Next Steps

1. ✅ Apply migrations (see Step 1-2 above)
2. ✅ Test admin functionality
3. ✅ Verify non-admin access is blocked
4. ✅ Document admin email in secure location
5. ✅ Set up monitoring for RLS violations (optional)

---

## 💡 Tips

- **Keep admin email secret** - It's your security key
- **Use strong passwords** - 12+ chars, mixed case, numbers, symbols
- **Enable 2FA on Supabase** - Extra protection for your database
- **Regular audits** - Review user access periodically

---

**Questions?** See full documentation: `docs/RLS_SECURITY.md`
