#!/bin/bash

# Apply User Metadata Admin Migration
# Switches from email whitelist to user metadata-based admin check

set -e  # Exit on error

echo "🔐 User Metadata Admin Migration"
echo "=================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

echo "📋 What this migration does:"
echo "  1. Updates is_admin() to check user metadata"
echo "  2. Sets is_admin=true for jukeramia@gmail.com"
echo "  3. Creates grant_admin() and revoke_admin() functions"
echo "  4. Keeps email fallback for emergency access"
echo ""
echo "🎯 Benefits:"
echo "  ✅ Industry standard RBAC approach"
echo "  ✅ Easy to add/remove admins"
echo "  ✅ No code changes needed"
echo "  ✅ Emergency email fallback"
echo ""

read -p "Proceed with migration? (y/N): " proceed

if [[ ! $proceed =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled."
    exit 1
fi

echo ""
echo "🚀 Applying migration..."
echo ""

# Check Supabase connection
echo "Checking Supabase connection..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Error: Cannot connect to Supabase"
    echo "Make sure you're logged in: supabase login"
    exit 1
fi

echo "✅ Supabase connection verified"
echo ""

# Apply migration
echo "Applying migration 011: Switch to metadata admin check..."
supabase db push

echo ""
echo "✅ Migration completed successfully!"
echo ""

# Verify migration
echo "🔍 Verifying admin setup..."
echo ""

# Create temporary SQL file for verification
cat > /tmp/verify_admin.sql <<'SQL'
-- Verify admin users
SELECT 
    email,
    (raw_user_meta_data->>'is_admin')::boolean as is_admin_flag,
    CASE 
        WHEN email IN ('jukeramia@gmail.com') THEN true
        ELSE false
    END as has_emergency_access
FROM auth.users
ORDER BY created_at;
SQL

# Try to execute verification (may fail if SQL execution not supported)
echo "Admin users in database:"
supabase db execute --file /tmp/verify_admin.sql 2>/dev/null || {
    echo "⚠️  Automatic verification not available"
    echo "Please verify manually in Supabase Dashboard → SQL Editor:"
    echo ""
    cat /tmp/verify_admin.sql
}

# Clean up
rm -f /tmp/verify_admin.sql

echo ""
echo "✅ Migration Complete!"
echo ""
echo "📝 Next Steps:"
echo "  1. Test admin login at /admin"
echo "  2. Try uploading a hero image or creating a product"
echo "  3. Verify admin functions work correctly"
echo ""
echo "🔧 Admin Management Commands:"
echo "  Grant admin:  SELECT grant_admin('user@example.com');"
echo "  Revoke admin: SELECT revoke_admin('user@example.com');"
echo "  List admins:  SELECT * FROM admin_users;"
echo ""
echo "📚 Documentation: docs/RLS_SECURITY.md"
echo ""
