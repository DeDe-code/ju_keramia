# Image Caching Strategy - Cloudflare R2 Free Tier Optimization

## Overview

This document outlines the comprehensive caching strategy implemented to stay within Cloudflare R2 free tier limits while delivering optimal performance for the Ju Keramia ceramic business website.

## Cloudflare R2 Free Tier Limits

### Storage & Operations (Monthly)

- **Storage**: 10 GB (free)
- **Class A Operations** (writes): 1,000,000 (free)
- **Class B Operations** (reads): 10,000,000 (free)

### What Counts as Operations?

- **Class A (Writes)**: PUT, POST, COPY, DELETE operations
- **Class B (Reads)**: GET, HEAD, LIST operations

## Caching Strategy Overview

Our multi-layered caching strategy reduces R2 read operations by:

1. **Browser caching** (30 days)
2. **IPX image optimization caching**
3. **HTTP cache headers**
4. **Image compression and format optimization**
5. **UCarousel lazy loading**

## Implementation Details

### 1. Browser-Level Caching (30 Days)

**File**: `nuxt.config.ts`

```typescript
image: {
  ipx: {
    maxAge: 60 * 60 * 24 * 30, // 30 days browser cache
  },
}

routeRules: {
  '/_ipx/**': {
    headers: {
      'Cache-Control': 'public, max-age=2592000, immutable',
    },
  },
  '/image/**': {
    headers: {
      'Cache-Control': 'public, max-age=2592000, immutable',
    },
  },
}
```

**Impact**:

- Once a browser loads an image, it won't request it again for 30 days
- Drastically reduces R2 Class B operations (reads)
- `immutable` directive tells browsers the image will never change

### 2. Image Format & Quality Optimization

**File**: `nuxt.config.ts`

```typescript
image: {
  quality: 75, // Reduced from 80 for better compression
  format: ['webp', 'avif', 'jpg'],
  presets: {
    productThumb: {
      modifiers: {
        format: 'webp',
        quality: 70,
        width: 400,
        height: 400,
        fit: 'cover',
      },
    },
    productDisplay: {
      modifiers: {
        format: 'webp',
        quality: 80,
        width: 800,
        height: 800,
        fit: 'cover',
      },
    },
    hero: {
      modifiers: {
        format: 'webp',
        quality: 85,
        width: 1920,
        height: 1080,
        fit: 'cover',
      },
    },
  },
}
```

**Impact**:

- WebP format provides 25-35% smaller file sizes vs JPEG
- Reduces storage usage on R2
- Faster downloads = better user experience
- Different quality settings per use case optimize bandwidth

### 3. UCarousel Implementation for Product Cards

**File**: `app/components/admin/products/ProductCard.vue`

**Features**:

- Displays up to 3 product images per product
- Lazy loading enabled on all images
- Arrows and dots only shown when multiple images exist
- Optimized image sizes for admin view (400x400)

```vue
<UCarousel
  v-if="carouselImages.length > 0"
  v-slot="{ item }"
  :items="carouselImages"
  :arrows="hasMultipleImages"
  :dots="hasMultipleImages"
>
  <NuxtImg
    :src="item"
    :alt="`${product.name} - Product Image`"
    loading="lazy"
    format="webp"
    quality="75"
    sizes="sm:100vw md:50vw lg:400px"
  />
</UCarousel>
```

**Impact**:

- Images only load when visible (lazy loading)
- Users can view all 3 product images without page navigation
- Smaller image sizes for carousel thumbnails (400x400 vs full resolution)
- Responsive sizes ensure optimal image for device

### 4. Image Preset Usage Guidelines

Use appropriate presets to minimize unnecessary R2 reads:

#### Admin Product Cards (Carousel)

```vue
<NuxtImg :src="image" preset="productThumb" loading="lazy" />
```

- **Size**: 400x400px
- **Quality**: 70%
- **Use case**: Admin dashboard product management

#### Shop/Product Display Pages

```vue
<NuxtImg :src="image" preset="productDisplay" loading="lazy" />
```

- **Size**: 800x800px
- **Quality**: 80%
- **Use case**: Public-facing product pages

#### Hero Images (Landing/About Pages)

```vue
<NuxtImg :src="image" preset="hero" loading="lazy" />
```

- **Size**: 1920x1080px
- **Quality**: 85%
- **Use case**: Landing page and about page hero sections

## Estimated R2 Operation Savings

### Before Caching Strategy

- **Scenario**: 100 products with 3 images each = 300 images
- **Admin views**: 10 users × 20 views/day × 30 days = 6,000 page loads
- **R2 reads without caching**: 6,000 × 300 = **1,800,000 operations/month**

### After Caching Strategy

- **First load**: 300 images cached in browser (300 R2 reads)
- **Subsequent loads**: 0 R2 reads (served from browser cache)
- **Monthly R2 reads**: ~300-600 operations (accounting for cache expiration)
- **Savings**: **99.97% reduction** in R2 Class B operations

### Storage Optimization

- **Without WebP**: 300 images × 500KB = 150 MB
- **With WebP**: 300 images × 350KB = 105 MB
- **Savings**: **30% reduction** in storage usage

## Best Practices

### 1. Image Upload Optimization

When uploading images via `AdminImageUploader`:

- Already converts to WebP automatically
- Compresses images client-side before upload
- Reduces R2 Class A operations (writes)

### 2. Avoid Cache Busting

- Don't append timestamps or random parameters to image URLs
- Use versioned filenames only when content changes
- Example: `product-mug-v2.webp` instead of `product-mug.webp?t=123456`

### 3. Monitor R2 Usage

Check Cloudflare R2 dashboard monthly:

1. Go to Cloudflare Dashboard → R2
2. Click on your bucket → Metrics
3. Monitor:
   - Storage usage (should stay < 10GB)
   - Class A operations (should stay < 1M)
   - Class B operations (should stay < 10M)

### 4. Image Naming Convention

Use descriptive, consistent naming:

```
hero/landing-{timestamp}.webp
hero/about-{timestamp}.webp
products/{slug}-{timestamp}.webp
```

## Cloudflare Cache Rules (Optional Enhancement)

For production, configure Cloudflare Cache Rules for your custom domain:

### Rule 1: Cache Images Aggressively

- **URL Path**: `*/image/*` or `*/_ipx/*`
- **Cache Level**: Standard
- **Edge Cache TTL**: 30 days
- **Browser Cache TTL**: 30 days

### Rule 2: Cache WebP Images

- **File Extension**: `webp`
- **Cache Level**: Standard
- **Edge Cache TTL**: 90 days (images rarely change)
- **Browser Cache TTL**: 30 days

**Impact**:

- Cloudflare edge cache serves images without touching R2
- Further reduces R2 Class B operations
- Improves global delivery speed (CDN)

## Cache Invalidation Strategy

### When to Invalidate Cache

1. **Product Image Update**:
   - Upload new image with new timestamp
   - Old image URL stays cached (no impact on users)
   - New image URL is fresh

2. **Hero Image Update**:
   - Same strategy as product images
   - New timestamp = new URL = fresh cache

3. **Force Refresh** (Emergency Only):
   ```bash
   # Cloudflare Dashboard → Caching → Purge Cache
   # Select: Purge by URL or Purge Everything
   ```

### Best Practice: Never Force Purge

- Use versioned URLs instead
- Let cache expire naturally
- Saves R2 operations and improves performance

## Monitoring & Alerts

### Set Up Cloudflare R2 Alerts

1. Go to Cloudflare Dashboard → Notifications
2. Create alert for:
   - Storage usage > 8GB (80% of free tier)
   - Class B operations > 8M/month (80% of free tier)
3. Receive email warnings before hitting limits

### Monthly Health Check

Check these metrics monthly:

- [ ] R2 storage usage
- [ ] R2 Class A operations (writes)
- [ ] R2 Class B operations (reads)
- [ ] Average image size
- [ ] Cache hit ratio (if using Cloudflare CDN)

## Troubleshooting

### Images Not Loading

1. Check browser cache (hard refresh: Ctrl+Shift+R)
2. Verify R2 public URL in environment variables
3. Check R2 bucket CORS settings
4. Verify image exists in R2 bucket

### High R2 Read Operations

1. Verify cache headers are set correctly
2. Check if browsers are respecting cache headers
3. Look for cache-busting parameters in URLs
4. Monitor for bots/crawlers hitting image URLs

### Image Quality Issues

1. Adjust quality settings in presets
2. Test different quality values (70-90)
3. Balance file size vs visual quality
4. Consider using AVIF for even better compression

## Future Enhancements

### 1. Service Worker Caching

Implement offline-first caching with service workers:

- Cache product images for offline viewing
- Pre-cache hero images on first load
- Further reduce R2 operations

### 2. CDN Integration

Use Cloudflare CDN with custom domain:

- Edge caching reduces R2 reads to near zero
- Global image delivery
- Automatic format optimization (Polish feature)

### 3. Image Lazy Loading Improvements

- Intersection Observer for better control
- Progressive image loading (blur-up technique)
- Skeleton screens while loading

### 4. Analytics Dashboard

Build custom dashboard to track:

- R2 usage trends
- Cache hit rates
- Image load performance
- User engagement with carousel

## Conclusion

This multi-layered caching strategy ensures the Ju Keramia website stays comfortably within Cloudflare R2 free tier limits while delivering excellent image performance. The UCarousel implementation allows users to view all product images without additional R2 operations, thanks to aggressive browser caching.

**Key Takeaways**:

- 30-day browser cache = 99%+ reduction in R2 reads
- WebP format = 30% reduction in storage
- UCarousel = Better UX without additional costs
- Lazy loading = Images load only when needed

Monitor your R2 dashboard monthly and follow the best practices outlined in this document to maintain optimal performance and cost efficiency.
