# User Metadata Admin Migration - Quick Guide

## 🎯 What Changed

Migrated from **email whitelist** to **user metadata-based admin check** (industry standard RBAC).

### Before (Email Whitelist)

```sql
-- Hardcoded email check
email IN ('jukeramia@gmail.com')
```

### After (User Metadata)

```sql
-- Flexible metadata flag with email fallback
(raw_user_meta_data->>'is_admin')::boolean = true
OR email IN ('jukeramia@gmail.com')  -- Emergency access
```

---

## ⚡ Quick Setup

### Option 1: Automated Script (Recommended)

```bash
./scripts/apply-metadata-admin-migration.sh
```

### Option 2: Manual

```bash
supabase db push
```

---

## 🛠️ Admin Management

### Grant Admin Access

```sql
-- Run in Supabase SQL Editor
SELECT grant_admin('newadmin@example.com');
```

### Revoke Admin Access

```sql
-- Run in Supabase SQL Editor
SELECT revoke_admin('user@example.com');
```

### List All Admins

```sql
-- Run in Supabase SQL Editor
SELECT * FROM admin_users;
```

---

## ✅ What You Get

### 1. Flexible Admin Management

- Add/remove admins without code changes
- No new migration files needed
- Instant updates

### 2. Emergency Access

- Email fallback (`jukeramia@gmail.com`) always works
- Safety net if metadata is cleared
- No lockout risk

### 3. Admin Functions

- `is_admin()` - Check if user is admin
- `grant_admin(email)` - Give admin access
- `revoke_admin(email)` - Remove admin access
- `admin_users` view - List all admins

### 4. Safety Features

- Can't remove last admin
- Admin-only functions
- Automatic validation

---

## 📊 Verify Migration

### Check Your Admin Status

```sql
-- Run in Supabase SQL Editor (while logged in)
SELECT
    auth.uid() as your_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as your_email,
    public.is_admin() as you_are_admin;
```

Expected result:

```
your_user_id | your_email           | you_are_admin
-------------|----------------------|---------------
<uuid>       | jukeramia@gmail.com  | true
```

### View All Admin Users

```sql
SELECT * FROM admin_users;
```

Expected result:

```
email                | is_admin | has_emergency_access
---------------------|----------|---------------------
jukeramia@gmail.com  | true     | true
```

---

## 🔐 Security Features

| Feature                     | Status                 |
| --------------------------- | ---------------------- |
| **Metadata-based check**    | ✅                     |
| **Email fallback**          | ✅                     |
| **Admin-only grant/revoke** | ✅                     |
| **Last admin protection**   | ✅                     |
| **RLS policies**            | ✅ (no changes needed) |

---

## 📝 Example: Adding a New Admin

### Scenario: Add `admin2@example.com` as admin

1. **User signs up normally** at `/admin`

2. **Current admin grants access** (in Supabase SQL Editor):

   ```sql
   SELECT grant_admin('admin2@example.com');
   ```

3. **New admin can now**:
   - Upload hero images
   - Create/edit/delete products
   - Grant admin to others

4. **Verify**:

   ```sql
   SELECT * FROM admin_users;
   ```

   Result:

   ```
   email                 | is_admin | has_emergency_access
   ----------------------|----------|---------------------
   jukeramia@gmail.com   | true     | true
   admin2@example.com    | true     | false
   ```

---

## 🚫 Example: Removing Admin Access

### Scenario: Remove `admin2@example.com` admin privileges

```sql
SELECT revoke_admin('admin2@example.com');
```

Result:

```json
{
  "success": true,
  "message": "Admin access revoked from admin2@example.com",
  "affected_rows": 1
}
```

**Note:** Cannot remove last admin:

```sql
SELECT revoke_admin('jukeramia@gmail.com');
-- ERROR: Cannot remove the last admin user
```

---

## 🔍 Troubleshooting

### Issue: Migration fails

**Solution:** Check Supabase connection

```bash
supabase login
supabase projects list
```

### Issue: Still using old email check

**Solution:** Verify migration applied

```sql
-- Check function definition
SELECT routine_definition
FROM information_schema.routines
WHERE routine_name = 'is_admin';

-- Should contain: raw_user_meta_data->>'is_admin'
```

### Issue: Admin can't upload images

**Solution:** Verify metadata is set

```sql
SELECT
    email,
    raw_user_meta_data->>'is_admin' as is_admin_flag,
    public.is_admin() as is_admin_result
FROM auth.users
WHERE email = 'jukeramia@gmail.com';

-- If is_admin_flag is NULL or false, run:
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{is_admin}',
    'true'::jsonb
)
WHERE email = 'jukeramia@gmail.com';
```

---

## 🎓 Understanding the Migration

### Why User Metadata?

1. **Industry Standard**: Used by Shopify, Stripe, Vercel, etc.
2. **Flexible**: Add/remove admins without code changes
3. **Scalable**: Works for 1-100 admins
4. **Auditable**: Can track changes in auth logs
5. **Future-proof**: Easy to extend to roles (admin, moderator, etc.)

### What Stays the Same?

- ✅ RLS policies (no changes)
- ✅ Admin dashboard (no changes)
- ✅ API routes (no changes)
- ✅ Client code (no changes)

### What Changes?

- ✅ Admin check now reads from metadata
- ✅ Can grant/revoke admin via SQL functions
- ✅ Email fallback for safety

---

## 📚 Related Documentation

- **Full Security Guide**: `docs/RLS_SECURITY.md`
- **Password Security**: `docs/PASSWORD_LEAK_CHECK.md`
- **RLS Quick Start**: `docs/RLS_QUICKSTART.md`

---

## 🚀 Next Steps

1. ✅ Apply migration (see Quick Setup above)
2. ✅ Verify your admin access works
3. ✅ Test uploading hero image or creating product
4. ✅ Try granting admin to a test user (optional)

---

**Migration file:** `supabase/migrations/011_switch_to_metadata_admin_check.sql`

**Questions?** Check `docs/RLS_SECURITY.md` or run:

```sql
-- Get function help
SELECT obj_description('public.is_admin'::regproc);
SELECT obj_description('public.grant_admin'::regproc);
SELECT obj_description('public.revoke_admin'::regproc);
```
