# Supabase Migrations

This document describes all active migrations in the project.

## Migration Files

### Core Schema

#### `001_create_products.sql`

- **Purpose:** Creates the `products` table
- **Tables:** `products`
- **Features:**
  - Product catalog schema
  - UUID primary key
  - JSON columns for dimensions and materials
  - Timestamps with auto-update trigger

#### `002_create_order.sql`

- **Purpose:** Creates the `orders` table for e-commerce
- **Tables:** `orders`
- **Features:**
  - Order tracking
  - Customer information
  - Foreign key to auth.users
  - Order status enum

#### `005_create_hero_images.sql`

- **Purpose:** Creates the `hero_images` table
- **Tables:** `hero_images`
- **Features:**
  - Landing and about page hero images
  - Cloudflare R2 integration
  - Image metadata (dimensions, file size)
  - Auto-update trigger

---

### Row Level Security (RLS)

#### `003_products_rls.sql`

- **Purpose:** Initial products RLS setup
- **Policies:**
  - ✅ Public read access (anyone can view products)
- **Note:** Write policies added in `010_fix_products_rls.sql`

#### `004_orders_rls.sql`

- **Purpose:** Orders RLS policies
- **Policies:**
  - Users can view their own orders
  - Admins can view all orders
  - Users can insert orders
  - Admins can update/delete orders

#### `009_fix_hero_images_rls.sql`

- **Purpose:** Secure hero_images RLS with admin-only write access
- **Replaces:** ~~`006-hero_images_rls.sql`~~ (removed - was insecure)
- **Creates:**
  - `is_admin()` function (email-based admin check)
  - Public read policy
  - Admin-only insert/update/delete policies
- **Security:** Only whitelisted admin emails can manage hero images

#### `010_fix_products_rls.sql`

- **Purpose:** Secure products RLS with admin-only write access
- **Replaces:** ~~`007_products_admin_policies.sql`~~ (removed - was insecure)
- **Creates:**
  - Admin-only insert/update/delete policies
  - Uses `is_admin()` function from migration 009
- **Security:** Only whitelisted admin emails can manage products

#### `011_switch_to_metadata_admin_check.sql` ⭐ **Current**

- **Purpose:** Migrate from email whitelist to user metadata-based admin check
- **Industry Standard:** RBAC with user metadata
- **Updates:**
  - `is_admin()` function (now checks `raw_user_meta_data->>'is_admin'`)
  - Sets `is_admin=true` for existing admin user
  - Keeps email fallback for emergency access
- **Creates:**
  - `grant_admin(email)` - Grant admin privileges
  - `revoke_admin(email)` - Revoke admin privileges
  - `admin_users` view - List all admins
- **Benefits:**
  - Easy to add/remove admins without migrations
  - Last admin protection
  - Audit trail capability

---

### Utility Functions

#### `008_fix_update_updated_at_search_path.sql`

- **Purpose:** Fixes search path for `update_updated_at_column()` trigger function
- **Fixes:** Schema resolution issues with timestamp triggers
- **Affected:** All tables with auto-update timestamps

---

## Migration Timeline

```
001 → 002 → 003 → 004 → 005 → 008 → 009 → 010 → 011
                                      ↓      ↓      ↓
                                  hero_img  prod  metadata
                                   admin   admin   admin
```

---

## Removed Migrations

### ❌ `006-hero_images_rls.sql` (Removed)

- **Why:** Insecure - allowed any authenticated user to manage hero images
- **Replaced by:** `009_fix_hero_images_rls.sql`

### ❌ `007_products_admin_policies.sql` (Removed)

- **Why:** Insecure - allowed any authenticated user to manage products
- **Replaced by:** `010_fix_products_rls.sql`

---

## Current Security Model

### Admin Verification

**Method:** User Metadata + Email Fallback

```sql
-- Primary: User metadata flag
(raw_user_meta_data->>'is_admin')::boolean = true

-- Fallback: Email whitelist
email IN ('jukeramia@gmail.com')
```

### Admin Management

```sql
-- Grant admin access
SELECT grant_admin('newadmin@example.com');

-- Revoke admin access
SELECT revoke_admin('user@example.com');

-- List all admins
SELECT * FROM admin_users;
```

### Protected Tables

| Table         | Public Read | Admin Write   | RLS Enabled |
| ------------- | ----------- | ------------- | ----------- |
| `products`    | ✅ Yes      | ✅ Admin-only | ✅          |
| `hero_images` | ✅ Yes      | ✅ Admin-only | ✅          |
| `orders`      | ❌ Own only | ✅ Admin-only | ✅          |

---

## Applying Migrations

### Production

```bash
# Push all migrations to remote database
supabase db push
```

### Local Development

```bash
# Reset local database
supabase db reset

# Or apply specific migration
supabase migration up
```

---

## Best Practices

1. ✅ **Never delete applied migrations** - They're part of database history
2. ✅ **Create new migrations for changes** - Don't edit existing ones
3. ✅ **Test locally first** - Use `supabase db reset` before pushing
4. ✅ **Use semantic naming** - `<number>_<descriptive_name>.sql`
5. ✅ **Include comments** - Document why changes were made

---

## Related Documentation

- **Security Guide:** `docs/RLS_SECURITY.md`
- **Admin Migration:** `docs/METADATA_ADMIN_MIGRATION.md`
- **Quick Start:** `docs/RLS_QUICKSTART.md`
- **Password Security:** `docs/PASSWORD_LEAK_CHECK.md`

---

**Last Updated:** December 8, 2025  
**Total Migrations:** 9 active files  
**Security Level:** ✅ Production-ready with industry-standard RBAC
