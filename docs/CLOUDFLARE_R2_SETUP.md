# Cloudflare R2 Setup Guide

## Overview

This document provides a complete step-by-step guide for setting up Cloudflare R2 object storage for the Ju Keramia project. R2 is used to store and serve all images (hero images and product photos) via a CDN.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Enable R2](#step-1-enable-r2)
3. [Step 2: Create Bucket](#step-2-create-bucket)
4. [Step 3: Create API Token](#step-3-create-api-token)
5. [Step 4: Enable Custom Domain](#step-4-enable-custom-domain)
6. [Step 5: Configure Environment Variables](#step-5-configure-environment-variables)
7. [Step 6: Update Nuxt Configuration](#step-6-update-nuxt-configuration)
8. [Credentials Summary](#credentials-summary)
9. [Testing & Verification](#testing--verification)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- ✅ Cloudflare account (free tier is sufficient)
- ✅ Payment method added (required for R2 activation, but won't be charged on free tier)
- ✅ Domain name (for production CDN URL)
- ✅ Domain DNS managed by Cloudflare (recommended) or access to DNS settings

---

## Step 1: Enable R2

### 1.1 Access R2 Dashboard

1. Log in to Cloudflare Dashboard: https://dash.cloudflare.com/
2. In the left sidebar, click **"R2"** (under Storage & Databases section)
3. You'll see the "Get started with R2" welcome screen

### 1.2 Activate R2

1. Click **"Add R2 subscription to my account"** button
2. Review the free tier limits:
   - **10GB storage/month** (free)
   - **1M Class A operations/month** (writes - free)
   - **10M Class B operations/month** (reads - free)
3. Add payment method if prompted (verification only)
4. Confirm subscription (Total: $0.00)

### 1.3 Verify Activation

- You should be redirected to the R2 dashboard
- Status should show "R2 enabled"

---

## Step 2: Create Bucket

### 2.1 Create New Bucket

1. From R2 dashboard, click **"Create bucket"** button
2. Fill in the form:

   **Bucket name:**

   ```
   jukeramia-images
   ```

   - Must be lowercase
   - Must be unique across all Cloudflare R2
   - Cannot be renamed later

   **Location:**

   ```
   Automatic (Recommended)
   ```

   - Cloudflare automatically selects Eastern Europe
   - Optimal for Hungarian/European users

   **Default Storage Class:**

   ```
   Standard
   ```

   - For frequently accessed objects
   - Covered by free tier

3. Click **"Create Bucket"**

### 2.2 Verify Bucket Creation

- Bucket should appear in the R2 dashboard
- Status: Active
- Name: `jukeramia-images`

---

## Step 3: Create API Token

### 3.1 Navigate to API Tokens

1. From R2 dashboard, click **"Manage R2 API Tokens"** (top right)
2. You'll see two sections:
   - Account API Tokens
   - User API Tokens

### 3.2 Create User API Token

1. Click **"Create User API Token"** (blue button)
2. Configure the token:

   **Token name:**

   ```
   ju-keramia-upload
   ```

   **Permissions:**

   ```
   ☑️ Object Read & Write
   ```

   - Do NOT select "Admin Read & Write"

   **TTL (Time to Live):**

   ```
   Forever
   ```

   - Token never expires (needed for production)

   **Apply to specific buckets:**

   ```
   ☑️ Apply to specific buckets only
   Select: jukeramia-images
   ```

   - Limits token to only this bucket (better security)

3. Click **"Create API Token"**

### 3.3 Save Credentials Immediately

⚠️ **CRITICAL**: You can only see the Secret Access Key ONCE!

The screen will display:

```
Access Key ID: [copy this]
Secret Access Key: [copy this - will never be shown again!]
```

**Action:**

1. Copy **Access Key ID** to secure location (password manager, notes)
2. Copy **Secret Access Key** to secure location
3. Do NOT close the window until saved!

### 3.4 Verify Token Creation

- Token should appear in the "User API Tokens" list
- Name: `ju-keramia-upload`
- Applied to: `jukeramia-images`
- Permission: `Object Read & Write`
- Status: **Active** (green badge)

---

## Step 4: Enable Custom Domain

### 4.1 Navigate to Bucket Settings

1. From R2 dashboard, click on bucket name: **jukeramia-images**
2. Click **"Settings"** tab
3. Find **"Custom Domains"** section

### 4.2 Add Custom Domain

1. Click **"+ Add"** button in Custom Domains section
2. Enter subdomain:

   ```
   cdn.jukeramia.com
   ```

   **Why subdomain?**
   - Main domain (`jukeramia.com`) is already pointing to Vercel
   - Subdomains allow multiple services
   - Industry standard for CDN/images

3. Click **"Add Domain"**

### 4.3 DNS Configuration

**If domain DNS is managed by Cloudflare:**

- ✅ Automatic! Cloudflare configures DNS automatically
- ✅ SSL certificate auto-generated
- ✅ Wait 5-30 minutes for propagation

**If domain DNS is elsewhere:**

- Add CNAME record manually:
  ```
  Type: CNAME
  Name: cdn
  Value: [provided by Cloudflare, looks like: xxx.r2.cloudflarestorage.com]
  TTL: Auto or 300
  ```

### 4.4 Verify Custom Domain

1. Wait for status to change from "Initializing" to **"Active"** (green)
2. Check "Access" column shows **"ALLOWED"** (green)
3. Domain should show:
   - Domain: `cdn.jukeramia.com`
   - Minimum TLS: `1.0`
   - Status: **Active**

### 4.5 Test Public Access

Once active, test in browser:

```
https://cdn.jukeramia.com
```

Expected result:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Error>
  <Code>AccessDenied</Code>
  <Message>Access Denied</Message>
</Error>
```

✅ This is CORRECT! It means the domain works but bucket is empty.

---

## Step 5: Configure Environment Variables

### 5.1 Locate Account ID

1. Go back to R2 main page (click "R2 Object Storage" in breadcrumb)
2. Look for **"Account ID"** displayed on the page
3. Copy the Account ID (format: `abc123def456...`)

### 5.2 Create/Update `.env` File

Create or update `.env` file in project root:

```bash
# Supabase Configuration (existing)
NUXT_PUBLIC_SUPABASE_URL=your_supabase_url
NUXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudflare R2 Configuration
NUXT_CLOUDFLARE_ACCOUNT_ID=paste_your_account_id_here
NUXT_CLOUDFLARE_ACCESS_KEY_ID=paste_your_access_key_id_here
NUXT_CLOUDFLARE_SECRET_ACCESS_KEY=paste_your_secret_access_key_here
NUXT_CLOUDFLARE_BUCKET_NAME=jukeramia-images
NUXT_PUBLIC_CLOUDFLARE_PUBLIC_URL=https://cdn.jukeramia.com

# Other existing configs
NUXT_RESEND_API_KEY=your_resend_key
NUXT_HCAPTCHA_SECRET_KEY=your_hcaptcha_secret
NUXT_PUBLIC_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key
NUXT_RESEND_TO_EMAIL=hello@jukeramia.com
NUXT_RESEND_FROM_EMAIL=contact@jukeramia.com
NUXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5.3 Security Check

✅ Verify `.env` is in `.gitignore`:

```gitignore
# Local env files
.env
.env.*
!.env.example
```

⚠️ **NEVER commit `.env` to Git!**

---

## Step 6: Update Nuxt Configuration

### 6.1 Update `nuxt.config.ts`

Add Cloudflare credentials to `runtimeConfig`:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // ... existing config

  runtimeConfig: {
    // Private keys (only available on server-side)
    resendApiKey: process.env.NUXT_RESEND_API_KEY,
    hcaptchaSecretKey: process.env.NUXT_HCAPTCHA_SECRET_KEY,
    resendToEmail: process.env.NUXT_RESEND_TO_EMAIL || 'hello@jukeramia.com',
    resendFromEmail: process.env.NUXT_RESEND_FROM_EMAIL || 'contact@jukeramia.com',

    // Cloudflare R2 (server-side only)
    cloudflareAccountId: process.env.NUXT_CLOUDFLARE_ACCOUNT_ID,
    cloudflareAccessKeyId: process.env.NUXT_CLOUDFLARE_ACCESS_KEY_ID,
    cloudflareSecretAccessKey: process.env.NUXT_CLOUDFLARE_SECRET_ACCESS_KEY,
    cloudflareBucketName: process.env.NUXT_CLOUDFLARE_BUCKET_NAME,

    // Public keys (exposed to client-side)
    public: {
      hcaptchaSiteKey: process.env.NUXT_PUBLIC_HCAPTCHA_SITE_KEY,
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,

      // Cloudflare CDN URL (public)
      cloudflarePublicUrl: process.env.NUXT_PUBLIC_CLOUDFLARE_PUBLIC_URL,
    },
  },

  // Allow images from CDN domain
  image: {
    quality: 80,
    format: ['webp', 'avif', 'jpg'],
    provider: 'ipx',
    domains: ['cdn.jukeramia.com'], // Add CDN domain
  },

  // ... rest of config
});
```

### 6.2 Verify Configuration

Restart dev server to load new environment variables:

```bash
npm run dev
```

---

## Credentials Summary

### Required Credentials Checklist

Copy these values from your Cloudflare setup:

```
✅ Bucket Name: jukeramia-images
✅ Account ID: [from R2 dashboard]
✅ Access Key ID: [from API token creation]
✅ Secret Access Key: [from API token creation - saved during creation]
✅ Public URL: https://cdn.jukeramia.com
✅ S3 Endpoint: https://4871c8933d491ca5068adc38cc50cb48.r2.cloudflarestorage.com
```

### Credential Locations

| Credential        | Where to Find                    | Where Used            |
| ----------------- | -------------------------------- | --------------------- |
| Account ID        | R2 dashboard main page           | `.env` + Server API   |
| Access Key ID     | API token creation screen        | `.env` + Server API   |
| Secret Access Key | API token creation screen        | `.env` + Server API   |
| Bucket Name       | R2 bucket list                   | `.env` + Server API   |
| Public URL        | Bucket Settings → Custom Domains | `.env` + Frontend     |
| S3 Endpoint       | Bucket Settings → S3 API         | Server API (optional) |

---

## Testing & Verification

### Test 1: Environment Variables Loaded

Create a test API route:

```typescript
// server/api/test-cloudflare.get.ts
export default defineEventHandler((event) => {
  const config = useRuntimeConfig();

  return {
    hasAccountId: !!config.cloudflareAccountId,
    hasAccessKey: !!config.cloudflareAccessKeyId,
    hasSecretKey: !!config.cloudflareSecretAccessKey,
    bucketName: config.cloudflareBucketName,
    publicUrl: config.public.cloudflarePublicUrl,
  };
});
```

Visit: `http://localhost:3000/api/test-cloudflare`

Expected response:

```json
{
  "hasAccountId": true,
  "hasAccessKey": true,
  "hasSecretKey": true,
  "bucketName": "jukeramia-images",
  "publicUrl": "https://cdn.jukeramia.com"
}
```

### Test 2: Custom Domain Accessible

Visit in browser:

```
https://cdn.jukeramia.com
```

Expected: "Access Denied" XML response (proves domain works)

### Test 3: DNS Propagation

Check DNS propagation:

```bash
nslookup cdn.jukeramia.com
```

Should return Cloudflare IP addresses.

---

## Troubleshooting

### Issue: "Access Denied" when uploading

**Cause**: API token doesn't have write permissions

**Solution**:

1. Go to R2 → Manage API Tokens
2. Verify token has "Object Read & Write" permission
3. Verify token is applied to correct bucket
4. Regenerate token if needed

### Issue: Custom domain not working

**Cause**: DNS not propagated or misconfigured

**Solution**:

1. Wait 30 minutes for DNS propagation
2. Verify CNAME record exists (if DNS not on Cloudflare)
3. Check bucket settings → Custom Domains → Status should be "Active"
4. Clear browser DNS cache: `chrome://net-internals/#dns`

### Issue: Environment variables not loading

**Cause**: `.env` file not in project root or server not restarted

**Solution**:

1. Verify `.env` is in project root (same level as `nuxt.config.ts`)
2. Restart dev server: `npm run dev`
3. Check for typos in variable names (must match `NUXT_*` pattern)

### Issue: CORS errors when uploading

**Cause**: CORS policy not configured on bucket

**Solution**:

1. Go to bucket Settings → CORS Policy
2. Add policy (we'll configure this in the upload implementation)

### Issue: "Invalid Access Key ID"

**Cause**: Incorrect credentials or token expired/deleted

**Solution**:

1. Verify credentials copied correctly (no extra spaces)
2. Check token still exists and is active in Cloudflare
3. Regenerate token if necessary

---

## Image Organization Structure

### Bucket Folder Structure

```
jukeramia-images/
├── hero/
│   ├── landing-{timestamp}.webp
│   └── about-{timestamp}.webp
├── products/
│   ├── {product-slug}-1-{timestamp}.webp
│   ├── {product-slug}-2-{timestamp}.webp
│   └── {product-slug}-3-{timestamp}.webp
└── temp/
    └── (temporary uploads, auto-deleted after 7 days)
```

### Image Specifications

**Hero Images:**

- Size: 1920x1080px (16:9 ratio)
- Format: WebP
- Quality: 85%
- Max file size: 500KB (after compression)

**Product Images:**

- Size: 800x800px (1:1 ratio - square)
- Format: WebP
- Quality: 85%
- Max file size: 300KB each (after compression)
- Count: Exactly 3 per product

---

## Free Tier Usage Estimates

### Monthly Estimates for Ju Keramia

**Storage:**

- ~100 hero images: ~50MB
- ~200 products × 3 images: ~180MB
- Total: ~230MB
- **Limit: 10GB** ✅ Well within limit

**Class A Operations (Writes):**

- Admin uploads: ~200-300/month
- **Limit: 1,000,000/month** ✅ Well within limit

**Class B Operations (Reads):**

- Website visitors: ~10,000-50,000/month
- **Limit: 10,000,000/month** ✅ Well within limit

### Cost: $0.00 per month

---

## Security Best Practices

1. ✅ **Never commit `.env`** - Always in `.gitignore`
2. ✅ **Use presigned URLs** - Don't expose credentials to browser
3. ✅ **Limit token scope** - Only "Object Read & Write", only specific bucket
4. ✅ **Short expiry times** - Presigned URLs expire in 5 minutes
5. ✅ **Admin authentication** - Only authenticated admins can upload
6. ✅ **Server-side validation** - Validate files on server, not just client
7. ✅ **HTTPS only** - Custom domain uses SSL automatically

---

## Next Steps

After completing this setup:

1. ✅ Install AWS SDK: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
2. ✅ Create server API for presigned URLs
3. ✅ Create upload composable with image compression
4. ✅ Build admin UI components
5. ✅ Test upload functionality
6. ✅ Configure CORS policy if needed

---

## References

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/)
- [Custom Domains](https://developers.cloudflare.com/r2/buckets/public-buckets/)

---

## Document Changelog

- **2025-11-06**: Initial setup documentation created
- **Bucket Created**: `jukeramia-images`
- **Custom Domain**: `cdn.jukeramia.com`
- **API Token**: `ju-keramia-upload` (Active)

---

**Document Status**: ✅ Complete and Verified
**Last Updated**: November 6, 2025
**Project**: Ju Keramia E-commerce Platform
