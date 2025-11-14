# Image Upload Composable Documentation

## Overview

The `useImageUpload` composable provides a complete solution for uploading, compressing, and managing images for the Ju Keramia e-commerce platform. It handles three types of images: landing page hero, about page hero, and product images.

**Features:**

- ✅ Client-side image compression and WebP conversion
- ✅ Direct uploads to Cloudflare R2 (bypasses server)
- ✅ Real-time upload progress tracking
- ✅ Automatic metadata storage in Supabase
- ✅ Comprehensive validation (type, size, dimensions)
- ✅ Error handling with user-friendly messages
- ✅ 50-80% file size reduction

---

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Basic Usage](#basic-usage)
3. [API Reference](#api-reference)
4. [Image Types](#image-types)
5. [Upload Workflow](#upload-workflow)
6. [Compression Details](#compression-details)
7. [Error Handling](#error-handling)
8. [Advanced Usage](#advanced-usage)
9. [Examples](#examples)
10. [Troubleshooting](#troubleshooting)

---

## Installation & Setup

### Prerequisites

Ensure the following are configured:

1. **Cloudflare R2 setup complete** (see `CLOUDFLARE_R2_SETUP.md`)
2. **Environment variables configured** in `.env`:
   ```bash
   NUXT_CLOUDFLARE_ACCOUNT_ID=your_account_id
   NUXT_CLOUDFLARE_ACCESS_KEY_ID=your_access_key
   NUXT_CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_key
   NUXT_CLOUDFLARE_BUCKET_NAME=jukeramia-images
   NUXT_PUBLIC_CLOUDFLARE_PUBLIC_URL=https://cdn.jukeramia.com
   ```
3. **Database migration applied** (`005_create_hero_images.sql`)
4. **Server API endpoint** (`server/api/admin/upload-url.post.ts`)

### Dependencies

The composable uses:

- Native browser Canvas API (no external libraries)
- Nuxt's `useFetch` composable
- Your existing `useSupabase` composable

---

## Basic Usage

### Import and Initialize

```vue
<script setup lang="ts">
import { useImageUpload } from '~/composables/useImageUpload';

const {
  uploadImage, // Main upload function
  progress, // Upload progress (0-100)
  isUploading, // Loading state
  error, // Error message
  validationErrors, // Detailed validation errors
  reset, // Reset state
  formatFileSize, // Utility function
} = useImageUpload();
</script>
```

### Simple Upload Example

```vue
<script setup lang="ts">
const { uploadImage, progress, isUploading, error } = useImageUpload();

const handleUpload = async (file: File) => {
  try {
    const result = await uploadImage(file, 'hero', 'landing');
    console.log('Uploaded to:', result.publicUrl);
    console.log(
      'File size reduced by:',
      ((1 - result.fileSize / result.originalFileSize) * 100).toFixed(0) + '%'
    );
  } catch (err) {
    console.error('Upload failed:', error.value);
  }
};
</script>

<template>
  <div>
    <input type="file" @change="(e) => handleUpload(e.target.files[0])" />
    <div v-if="isUploading">Uploading: {{ progress }}%</div>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>
```

---

## API Reference

### Main Function

#### `uploadImage(file, imageType, subType, options?)`

Uploads an image to Cloudflare R2 with compression and validation.

**Parameters:**

| Parameter   | Type                          | Required | Description                                                                                    |
| ----------- | ----------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `file`      | `File`                        | ✅ Yes   | The image file to upload                                                                       |
| `imageType` | `'hero' \| 'product'`         | ✅ Yes   | Type of image being uploaded                                                                   |
| `subType`   | `string`                      | ✅ Yes   | Page type for hero (`'landing'` or `'about'`) or product slug with number (`'ceramic-bowl-1'`) |
| `options`   | `Partial<ImageUploadOptions>` | ❌ No    | Optional configuration (see below)                                                             |

**Options Object:**

```typescript
interface ImageUploadOptions {
  maxWidth?: number; // Max width in pixels (default: 1920 for hero, 800 for product)
  maxHeight?: number; // Max height in pixels (default: 1080 for hero, 800 for product)
  quality?: number; // Compression quality 0-1 (default: 0.85)
}
```

**Returns:**

```typescript
Promise<ImageUploadResult>;

interface ImageUploadResult {
  publicUrl: string; // URL where image is accessible
  key: string; // R2 object key (path in bucket)
  width: number; // Final image width in pixels
  height: number; // Final image height in pixels
  fileSize: number; // Final file size in bytes
  originalFileSize: number; // Original file size before compression
}
```

**Example:**

```typescript
const result = await uploadImage(
  myFile,
  'product',
  'ceramic-vase-1',
  { quality: 0.9 } // Higher quality
);

console.log(result);
// {
//   publicUrl: "https://cdn.jukeramia.com/products/ceramic-vase-1-1699123456.webp",
//   key: "products/ceramic-vase-1-1699123456.webp",
//   width: 800,
//   height: 800,
//   fileSize: 245000,
//   originalFileSize: 1500000
// }
```

---

### State Properties

#### `progress`

- **Type:** `Ref<number>`
- **Description:** Upload progress from 0 to 100
- **Values:**
  - `0` - Not started
  - `10` - Validation started
  - `20` - Validation complete
  - `40` - Compression complete
  - `50` - Requesting upload URL
  - `60` - Got upload URL
  - `90` - Upload to R2 complete
  - `100` - Metadata saved, fully complete

**Example:**

```vue
<template>
  <progress :value="progress" max="100"></progress>
  <p>{{ progress }}% complete</p>
</template>
```

#### `isUploading`

- **Type:** `Ref<boolean>`
- **Description:** `true` during upload process, `false` otherwise
- **Use:** Disable UI elements during upload

**Example:**

```vue
<template>
  <button :disabled="isUploading">
    {{ isUploading ? 'Uploading...' : 'Upload Image' }}
  </button>
</template>
```

#### `error`

- **Type:** `Ref<string | null>`
- **Description:** User-friendly error message, `null` if no error
- **Values:** Error message string or `null`

**Example:**

```vue
<template>
  <div v-if="error" class="error-message">
    {{ error }}
  </div>
</template>
```

#### `validationErrors`

- **Type:** `Ref<ImageValidationError[]>`
- **Description:** Detailed validation errors with field information
- **Structure:**
  ```typescript
  interface ImageValidationError {
    field: string; // 'fileType' | 'fileSize' | 'dimensions'
    message: string; // Detailed error message
  }
  ```

**Example:**

```vue
<template>
  <ul v-if="validationErrors.length > 0">
    <li v-for="err in validationErrors" :key="err.field">
      <strong>{{ err.field }}:</strong> {{ err.message }}
    </li>
  </ul>
</template>
```

---

### Utility Functions

#### `reset()`

Resets all state to initial values.

**Usage:**

```typescript
const { reset } = useImageUpload();

// After successful upload or to clear errors
reset();
```

**What it resets:**

- `progress` → `0`
- `isUploading` → `false`
- `error` → `null`
- `validationErrors` → `[]`

#### `formatFileSize(bytes)`

Formats bytes into human-readable file size.

**Parameters:**

- `bytes` (number) - File size in bytes

**Returns:** `string` - Formatted file size

**Example:**

```typescript
const { formatFileSize } = useImageUpload();

formatFileSize(1024); // "1.0 KB"
formatFileSize(1048576); // "1.0 MB"
formatFileSize(2500000); // "2.4 MB"
formatFileSize(500); // "500 B"
```

#### `compressImage(file, maxWidth, maxHeight, quality?)`

Standalone image compression function (exposed for advanced use).

**Parameters:**

- `file` (File) - Image file to compress
- `maxWidth` (number) - Maximum width in pixels
- `maxHeight` (number) - Maximum height in pixels
- `quality` (number) - Compression quality 0-1 (default: 0.85)

**Returns:**

```typescript
Promise<{ blob: Blob; width: number; height: number }>;
```

**Example:**

```typescript
const { compressImage } = useImageUpload();

const compressed = await compressImage(myFile, 1200, 800, 0.9);
console.log(`Compressed to ${compressed.width}x${compressed.height}`);
```

---

## Image Types

### 1. Hero Images

Hero images are large background images for landing and about pages.

#### Landing Page Hero

```typescript
await uploadImage(file, 'hero', 'landing');
```

**Specifications:**

- **Dimensions:** 1920x1080px (16:9 aspect ratio)
- **Format:** WebP
- **Quality:** 85%
- **Target file size:** < 500KB (after compression)
- **Storage location:** `hero/landing-{timestamp}.webp`
- **Database:** Saved to `hero_images` table with `page_type = 'landing'`

#### About Page Hero

```typescript
await uploadImage(file, 'hero', 'about');
```

**Specifications:**

- **Dimensions:** 1920x1080px (16:9 aspect ratio)
- **Format:** WebP
- **Quality:** 85%
- **Target file size:** < 500KB (after compression)
- **Storage location:** `hero/about-{timestamp}.webp`
- **Database:** Saved to `hero_images` table with `page_type = 'about'`

**Important:** Uploading a new hero image **replaces** the existing one (upsert behavior).

---

### 2. Product Images

Product images are square images displayed on product pages. Each product has exactly 3 images.

```typescript
// Upload 3 images for one product
const img1 = await uploadImage(file1, 'product', 'ceramic-bowl-1');
const img2 = await uploadImage(file2, 'product', 'ceramic-bowl-2');
const img3 = await uploadImage(file3, 'product', 'ceramic-bowl-3');
```

**Specifications:**

- **Dimensions:** 800x800px (1:1 aspect ratio - square)
- **Format:** WebP
- **Quality:** 85%
- **Target file size:** < 300KB each (after compression)
- **Count:** Exactly 3 per product
- **Storage location:** `products/{product-slug-number}-{timestamp}.webp`
- **Database:** NOT automatically saved; URLs stored in `products.images[]` array when creating/updating product

**Naming Convention:**

- First image: `product-name-1`
- Second image: `product-name-2`
- Third image: `product-name-3`

**Note:** The number in the slug indicates which of the 3 images it is, NOT a product ID.

---

## Upload Workflow

### Complete Upload Process

```
┌─────────────────────────────────────────────────────┐
│ 1. User selects image file                         │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│ 2. VALIDATION (Client-side)                        │
│    ✓ File type (JPG, PNG, WebP only)              │
│    ✓ File size (max 10MB before compression)      │
│    ✓ Dimensions (warn if < 400px)                 │
│    Progress: 0% → 20%                              │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│ 3. COMPRESSION (Client-side, Canvas API)           │
│    ✓ Resize to target dimensions                   │
│    ✓ Maintain aspect ratio                         │
│    ✓ Convert to WebP format                        │
│    ✓ Apply 85% quality compression                 │
│    Result: 50-80% file size reduction              │
│    Progress: 20% → 40%                             │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│ 4. REQUEST PRESIGNED URL (Server API call)         │
│    POST /api/admin/upload-url                       │
│    Body: { fileName, fileType, fileSize,           │
│            imageType, subType }                     │
│    Server validates and generates secure URL        │
│    Progress: 40% → 60%                             │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│ 5. UPLOAD TO CLOUDFLARE R2 (Direct browser → R2)   │
│    PUT request to presigned URL                     │
│    No server involvement (saves bandwidth)          │
│    Progress: 60% → 90%                             │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│ 6. SAVE METADATA (Conditional)                     │
│    IF hero image: Save to hero_images table        │
│    IF product: Return URLs for manual save         │
│    Progress: 90% → 100%                            │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│ 7. RETURN RESULT                                   │
│    { publicUrl, key, width, height,                │
│      fileSize, originalFileSize }                  │
└─────────────────────────────────────────────────────┘
```

---

## Compression Details

### How Compression Works

The composable uses the browser's **Canvas API** to compress images client-side:

1. **Load original image** into an `Image` object
2. **Calculate new dimensions** maintaining aspect ratio
3. **Create canvas** element with target dimensions
4. **Draw resized image** on canvas with high-quality smoothing
5. **Export as WebP** blob with 85% quality
6. **Convert to File** for upload

### Compression Results

**Example: Hero Image**

```
Original: hero-landing.jpg
- Size: 3.5 MB
- Dimensions: 3840x2160px
- Format: JPEG

Compressed: hero-landing.webp
- Size: 450 KB (87% reduction)
- Dimensions: 1920x1080px
- Format: WebP
```

**Example: Product Image**

```
Original: ceramic-bowl.png
- Size: 2.1 MB
- Dimensions: 2000x2000px
- Format: PNG

Compressed: ceramic-bowl.webp
- Size: 180 KB (91% reduction)
- Dimensions: 800x800px
- Format: WebP
```

### Why WebP?

- **Better compression:** 25-35% smaller than JPEG at same quality
- **Browser support:** 97%+ of users (all modern browsers)
- **Quality:** Excellent visual quality even at 85%
- **Speed:** Faster page loads due to smaller file sizes

### Customizing Compression

```typescript
// Higher quality (larger file size)
await uploadImage(file, 'hero', 'landing', { quality: 0.95 });

// Custom dimensions
await uploadImage(file, 'product', 'item-1', {
  maxWidth: 1000,
  maxHeight: 1000,
  quality: 0.9,
});
```

---

## Error Handling

### Error Types

#### 1. Validation Errors

Errors caught before upload begins:

```typescript
// File type error
{
  field: 'fileType',
  message: 'Invalid file type. Allowed: JPG, PNG, WebP. Got: image/gif'
}

// File size error
{
  field: 'fileSize',
  message: 'File too large. Maximum: 10MB. Your file: 15.3MB'
}

// Dimension warning
{
  field: 'dimensions',
  message: 'Image resolution is low (300x300). Recommended minimum: 800x800px'
}
```

#### 2. Compression Errors

```
- "Failed to load image for compression"
- "Failed to get canvas context"
- "Failed to create compressed image"
```

#### 3. Upload Errors

```
- "Failed to get upload URL"
- "Upload failed: Forbidden"
- "Upload failed: Network error"
```

#### 4. Database Errors

Hero image metadata save failures (logged, don't stop upload).

### Handling Errors in UI

```vue
<script setup lang="ts">
const { uploadImage, error, validationErrors } = useImageUpload();

const handleUpload = async (file: File) => {
  try {
    const result = await uploadImage(file, 'hero', 'landing');
    // Success handling
  } catch (err) {
    // error.value contains user-friendly message
    // validationErrors.value contains detailed errors

    if (validationErrors.value.length > 0) {
      // Show specific validation issues
      console.log('Validation failed:', validationErrors.value);
    } else {
      // Show general error
      console.log('Upload failed:', error.value);
    }
  }
};
</script>

<template>
  <div>
    <!-- General error -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Detailed validation errors -->
    <ul v-if="validationErrors.length > 0" class="validation-errors">
      <li v-for="err in validationErrors" :key="err.field">
        {{ err.message }}
      </li>
    </ul>
  </div>
</template>
```

---

## Advanced Usage

### Multiple File Uploads

Upload multiple product images in sequence:

```typescript
const { uploadImage } = useImageUpload();

const uploadProductImages = async (files: File[], productSlug: string) => {
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadImage(files[i], 'product', `${productSlug}-${i + 1}`);
    results.push(result.publicUrl);
  }

  return results; // Array of 3 URLs
};

// Usage
const imageUrls = await uploadProductImages([file1, file2, file3], 'ceramic-bowl');
// ['https://cdn.jukeramia.com/products/ceramic-bowl-1-...webp', ...]
```

### Progress Tracking

Track overall progress for multiple uploads:

```vue
<script setup lang="ts">
const { uploadImage, progress } = useImageUpload();
const overallProgress = ref(0);

const uploadMultiple = async (files: File[]) => {
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadImage(files[i], 'product', `item-${i + 1}`);
    results.push(result);

    // Update overall progress
    overallProgress.value = Math.round(((i + 1) / files.length) * 100);
  }

  return results;
};
</script>

<template>
  <div>
    <p>Uploading image {{ Math.ceil(overallProgress.value / 33) }} of 3</p>
    <progress :value="overallProgress" max="100"></progress>
  </div>
</template>
```

### Custom Validation

Add custom validation before upload:

```typescript
const { uploadImage } = useImageUpload();

const uploadWithCustomValidation = async (file: File) => {
  // Custom validation
  if (file.name.includes('test')) {
    throw new Error('Test files not allowed');
  }

  // Check file extension manually
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
    throw new Error('Invalid file extension');
  }

  // Proceed with upload
  return await uploadImage(file, 'hero', 'landing');
};
```

### Retry Logic

Implement retry for failed uploads:

```typescript
const uploadWithRetry = async (
  file: File,
  imageType: 'hero' | 'product',
  subType: string,
  maxRetries = 3
) => {
  const { uploadImage } = useImageUpload();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadImage(file, imageType, subType);
    } catch (err) {
      if (attempt === maxRetries) throw err;

      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};
```

---

## Examples

### Example 1: Landing Page Hero Upload

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useImageUpload } from '~/composables/useImageUpload';

const { uploadImage, progress, isUploading, error, reset } = useImageUpload();
const currentHeroUrl = ref<string | null>(null);

const handleFileSelect = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  reset(); // Clear previous state

  try {
    const result = await uploadImage(file, 'hero', 'landing');
    currentHeroUrl.value = result.publicUrl;
    console.log(
      `Saved ${((1 - result.fileSize / result.originalFileSize) * 100).toFixed(0)}% space!`
    );
  } catch (err) {
    console.error('Upload failed:', error.value);
  }
};
</script>

<template>
  <div class="hero-upload">
    <h2>Landing Page Hero Image</h2>

    <!-- Current hero preview -->
    <div v-if="currentHeroUrl" class="current-hero">
      <img :src="currentHeroUrl" alt="Landing hero" />
    </div>

    <!-- Upload input -->
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      @change="handleFileSelect"
      :disabled="isUploading"
    />

    <!-- Progress bar -->
    <div v-if="isUploading" class="upload-progress">
      <progress :value="progress" max="100"></progress>
      <p>Uploading: {{ progress }}%</p>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.current-hero img {
  max-width: 400px;
  border-radius: 8px;
}

.upload-progress {
  margin-top: 16px;
}

progress {
  width: 100%;
  height: 24px;
}

.error {
  color: red;
  margin-top: 8px;
}
</style>
```

### Example 2: Product Creation with 3 Images

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useImageUpload } from '~/composables/useImageUpload';
import { useSupabase } from '~/composables/useSupabase';

const { uploadImage, progress, isUploading } = useImageUpload();
const supabase = useSupabase();

const productName = ref('');
const productPrice = ref(0);
const productDescription = ref('');
const selectedFiles = ref<File[]>([]);
const imagePreviewUrls = ref<string[]>([]);

const handleFilesSelect = (event: Event) => {
  const files = Array.from((event.target as HTMLInputElement).files || []);

  if (files.length !== 3) {
    alert('Please select exactly 3 images');
    return;
  }

  selectedFiles.value = files;

  // Create preview URLs
  imagePreviewUrls.value = files.map((file) => URL.createObjectURL(file));
};

const createProduct = async () => {
  if (selectedFiles.value.length !== 3) {
    alert('Please select 3 images');
    return;
  }

  try {
    // Generate product slug
    const slug = productName.value.toLowerCase().replace(/\s+/g, '-');

    // Upload all 3 images
    const uploadPromises = selectedFiles.value.map((file, index) =>
      uploadImage(file, 'product', `${slug}-${index + 1}`)
    );

    const results = await Promise.all(uploadPromises);
    const imageUrls = results.map((r) => r.publicUrl);

    // Save product to database
    const { error } = await supabase.from('products').insert({
      name: productName.value,
      slug: slug,
      price: productPrice.value,
      description: productDescription.value,
      images: imageUrls,
      in_stock: true,
      featured: false,
    });

    if (error) throw error;

    alert('Product created successfully!');

    // Reset form
    productName.value = '';
    productPrice.value = 0;
    productDescription.value = '';
    selectedFiles.value = [];
    imagePreviewUrls.value = [];
  } catch (err) {
    console.error('Failed to create product:', err);
    alert('Failed to create product');
  }
};
</script>

<template>
  <form @submit.prevent="createProduct" class="product-form">
    <h2>Create New Product</h2>

    <input v-model="productName" placeholder="Product Name" required />
    <input v-model.number="productPrice" type="number" placeholder="Price" required />
    <textarea v-model="productDescription" placeholder="Description" required></textarea>

    <div class="image-upload">
      <label>Upload 3 Product Images:</label>
      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        @change="handleFilesSelect"
        :disabled="isUploading"
      />

      <!-- Image previews -->
      <div v-if="imagePreviewUrls.length > 0" class="previews">
        <img
          v-for="(url, index) in imagePreviewUrls"
          :key="index"
          :src="url"
          :alt="`Preview ${index + 1}`"
        />
      </div>
    </div>

    <!-- Progress -->
    <div v-if="isUploading" class="progress">
      <progress :value="progress" max="100"></progress>
      <p>Uploading images: {{ progress }}%</p>
    </div>

    <button type="submit" :disabled="isUploading || selectedFiles.length !== 3">
      {{ isUploading ? 'Creating...' : 'Create Product' }}
    </button>
  </form>
</template>

<style scoped>
.product-form {
  max-width: 600px;
  margin: 0 auto;
}

.product-form input,
.product-form textarea {
  width: 100%;
  margin-bottom: 16px;
  padding: 8px;
}

.previews {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.previews img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}
</style>
```

### Example 3: Drag and Drop Upload

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useImageUpload } from '~/composables/useImageUpload';

const { uploadImage, progress, isUploading, error } = useImageUpload();
const isDragging = ref(false);
const uploadedUrl = ref<string | null>(null);

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = async (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = false;

  const files = Array.from(event.dataTransfer?.files || []);
  const file = files[0];

  if (!file || !file.type.startsWith('image/')) {
    alert('Please drop an image file');
    return;
  }

  try {
    const result = await uploadImage(file, 'hero', 'landing');
    uploadedUrl.value = result.publicUrl;
  } catch (err) {
    console.error('Upload failed:', error.value);
  }
};
</script>

<template>
  <div
    class="dropzone"
    :class="{ 'is-dragging': isDragging, 'is-uploading': isUploading }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div v-if="!isUploading && !uploadedUrl" class="dropzone-content">
      <p>Drag and drop image here</p>
      <p class="hint">or click to select</p>
    </div>

    <div v-if="isUploading" class="uploading">
      <progress :value="progress" max="100"></progress>
      <p>{{ progress }}%</p>
    </div>

    <div v-if="uploadedUrl && !isUploading" class="success">
      <img :src="uploadedUrl" alt="Uploaded" />
      <p>Upload complete!</p>
    </div>

    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.dropzone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 48px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.dropzone.is-dragging {
  border-color: #4caf50;
  background-color: #f0f8f0;
}

.dropzone.is-uploading {
  border-color: #2196f3;
  background-color: #e3f2fd;
}

.dropzone-content p {
  margin: 8px 0;
}

.hint {
  font-size: 0.9em;
  color: #666;
}

.success img {
  max-width: 300px;
  margin-bottom: 16px;
  border-radius: 8px;
}

progress {
  width: 100%;
  height: 24px;
}
</style>
```

---

## Troubleshooting

### Issue: "Failed to get upload URL"

**Cause:** Server API endpoint not working or misconfigured.

**Solution:**

1. Check server API file exists: `server/api/admin/upload-url.post.ts`
2. Verify environment variables are set in `.env`
3. Check server logs for errors
4. Test API endpoint manually:
   ```bash
   curl -X POST http://localhost:3000/api/admin/upload-url \
     -H "Content-Type: application/json" \
     -d '{"fileName":"test.jpg","fileType":"image/jpeg","fileSize":100000,"imageType":"hero","subType":"landing"}'
   ```

### Issue: "Upload failed: Forbidden"

**Cause:** Presigned URL expired or invalid credentials.

**Solution:**

1. Presigned URLs expire after 5 minutes - try uploading faster
2. Verify Cloudflare R2 credentials in `.env`
3. Check API token permissions in Cloudflare dashboard
4. Ensure bucket name is correct

### Issue: "Failed to create compressed image"

**Cause:** Browser doesn't support WebP or Canvas API issue.

**Solution:**

1. Check browser compatibility (use Chrome, Firefox, Edge, Safari 14+)
2. Image file might be corrupted - try different image
3. Check browser console for Canvas errors

### Issue: Large images upload slowly

**Cause:** Compression happens client-side before upload.

**Solution:**

1. This is normal for large images (> 5MB)
2. Consider validating file size earlier
3. Show compression progress to user
4. Use lower quality setting for faster compression:
   ```typescript
   await uploadImage(file, 'hero', 'landing', { quality: 0.7 });
   ```

### Issue: Images look blurry after upload

**Cause:** Original image resolution too low.

**Solution:**

1. Upload higher resolution images (minimum 800x800px for products, 1920x1080px for hero)
2. Increase quality setting:
   ```typescript
   await uploadImage(file, 'hero', 'landing', { quality: 0.95 });
   ```
3. Check original image quality before upload

### Issue: "Image resolution is low" warning

**Cause:** Original image dimensions less than 400x400px.

**Solution:**

1. This is just a warning, upload will proceed
2. Upload higher resolution images for better quality
3. Ignore if intentional (e.g., thumbnails)

### Issue: Progress stuck at certain percentage

**Cause:** Network issue or R2 endpoint timeout.

**Solution:**

1. Check internet connection
2. Try uploading smaller image first
3. Check Cloudflare R2 status page
4. Implement retry logic (see Advanced Usage section)

### Issue: Hero image not showing on page after upload

**Cause:** Page not refreshing or fetching old data.

**Solution:**

1. Refresh the page
2. Check browser DevTools Network tab to see if image URL is correct
3. Verify image was saved to `hero_images` table:
   ```sql
   SELECT * FROM hero_images WHERE page_type = 'landing';
   ```
4. Check if CDN URL is correct in browser

---

## Performance Tips

### 1. Batch Multiple Uploads

Upload product images in parallel:

```typescript
// Instead of sequential
for (const file of files) {
  await uploadImage(file, 'product', `item-${i}`);
}

// Use parallel
const uploads = files.map((file, i) => uploadImage(file, 'product', `item-${i}`));
const results = await Promise.all(uploads);
```

### 2. Optimize Compression Settings

For faster uploads, reduce quality slightly:

```typescript
// Default: 85% quality, smaller files
await uploadImage(file, 'product', 'item-1');

// Higher quality (slower upload, larger files)
await uploadImage(file, 'product', 'item-1', { quality: 0.95 });

// Lower quality (faster upload, smaller files)
await uploadImage(file, 'product', 'item-1', { quality: 0.75 });
```

### 3. Validate Early

Validate files before showing upload UI:

```typescript
const validateBeforeUpload = (file: File) => {
  if (!file.type.startsWith('image/')) {
    return 'Not an image file';
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'File too large (max 10MB)';
  }
  return null;
};

const error = validateBeforeUpload(selectedFile);
if (error) {
  alert(error);
  return;
}
```

---

## Security Considerations

### 1. Admin Authentication

**TODO:** Integrate admin authentication in server API:

```typescript
// server/api/admin/upload-url.post.ts
export default defineEventHandler(async (event) => {
  // Add authentication check
  const session = await getServerSession(event);
  if (!session || !session.user?.isAdmin) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized: Admin access required',
    });
  }

  // Rest of upload logic...
});
```

### 2. File Validation

Always validate on both client and server:

- **Client:** User experience (instant feedback)
- **Server:** Security (can't be bypassed)

### 3. Presigned URL Expiration

URLs expire after 5 minutes - this is intentional:

- Prevents URL reuse
- Limits attack window
- Forces fresh authentication

### 4. CORS Configuration

Configure CORS on R2 bucket if needed:

```json
{
  "AllowedOrigins": ["https://jukeramia.com"],
  "AllowedMethods": ["PUT"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3000
}
```

---

## Related Documentation

- **Cloudflare R2 Setup:** See `CLOUDFLARE_R2_SETUP.md`
- **Server API Documentation:** See `server/api/admin/upload-url.post.ts`
- **Database Schema:** See `supabase/migrations/005_create_hero_images.sql`
- **Admin Dashboard:** See `app/pages/admin/index.vue`

---

## Support & Contributing

### Reporting Issues

If you encounter issues:

1. Check this documentation
2. Review troubleshooting section
3. Check browser console for errors
4. Verify environment variables are set
5. Test server API endpoint manually

### Future Improvements

Potential enhancements:

- [ ] Add image cropping UI
- [ ] Support additional image formats (AVIF)
- [ ] Implement background uploads (Service Worker)
- [ ] Add image editing features (brightness, contrast)
- [ ] Support video thumbnails
- [ ] Add bulk upload for multiple products

---

**Document Version:** 1.0.0  
**Last Updated:** November 9, 2025  
**Composable Version:** 1.0.0  
**Author:** Ju Keramia Development Team
