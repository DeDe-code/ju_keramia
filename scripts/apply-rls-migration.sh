#!/bin/bash

# RLS Security Migration Script
# Applies RLS policy fixes for hero_images and products tables

set -e  # Exit on error

echo "🔒 Ju Keramia - RLS Security Migration"
echo "======================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Confirm admin email
echo "⚠️  IMPORTANT: Update admin email before proceeding!"
echo ""
echo "Edit this file and replace 'jukeramia@gmail.com' with your admin email:"
echo "  supabase/migrations/009_fix_hero_images_rls.sql"
echo ""
read -p "Have you updated the admin email? (y/N): " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled. Please update the admin email first."
    exit 1
fi

echo ""
echo "📋 Migration Plan:"
echo "  1. Drop overly permissive policies"
echo "  2. Create is_admin() helper function"
echo "  3. Apply strict admin-only policies to hero_images"
echo "  4. Apply strict admin-only policies to products"
echo ""
read -p "Proceed with migration? (y/N): " proceed

if [[ ! $proceed =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled."
    exit 1
fi

echo ""
echo "🚀 Running migrations..."
echo ""

# Check Supabase connection
echo "Checking Supabase connection..."
if ! supabase db push --dry-run &> /dev/null; then
    echo "❌ Error: Cannot connect to Supabase"
    echo "Make sure you're logged in: supabase login"
    echo "And linked to your project: supabase link --project-ref <your-project-ref>"
    exit 1
fi

echo "✅ Supabase connection verified"
echo ""

# Apply migrations
echo "Applying migration 009: Fix hero_images RLS..."
supabase migration apply --version 009

echo "✅ Migration 009 applied"
echo ""

echo "Applying migration 010: Fix products RLS..."
supabase migration apply --version 010

echo "✅ Migration 010 applied"
echo ""

# Verify RLS is enabled
echo "Verifying RLS status..."
echo ""

supabase db execute <<SQL
-- Check RLS status
SELECT 
    schemaname,
    tablename,
    relrowsecurity as rls_enabled
FROM 
    pg_tables
    JOIN pg_class ON pg_tables.tablename = pg_class.relname
WHERE 
    schemaname = 'public'
    AND tablename IN ('hero_images', 'products')
ORDER BY 
    tablename;

-- List policies
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM 
    pg_policies
WHERE 
    schemaname = 'public'
    AND tablename IN ('hero_images', 'products')
ORDER BY 
    tablename, policyname;
SQL

echo ""
echo "✅ Migration completed successfully!"
echo ""
echo "📝 Next Steps:"
echo "  1. Test admin login: /admin"
echo "  2. Try uploading a hero image"
echo "  3. Try creating a product"
echo "  4. Verify non-admin users cannot modify data"
echo ""
echo "📚 Documentation: docs/RLS_SECURITY.md"
echo ""
