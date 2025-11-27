# Ju Keramia - Copilot Instructions

## Project Overview

Ju Keramia is a ceramics business website built with Nuxt 3, featuring a custom ceramic-inspired design system. The project emphasizes artisanal, handcrafted aesthetics with earth-tone colors and organic feel.

## Architecture & Stack

- **Framework**: Nuxt 3.x with TypeScript
- **UI Library**: Nuxt UI v3 with extensive custom theming
- **Styling**: Tailwind CSS with custom ceramic design tokens
- **State**: Pinia for global state management
- **Content**: Nuxt Content module
- **Package Manager**: npm
- **Code Quality**: ESLint, Prettier, Husky with lint-staged
- **Icons**: Nuxt Icon with Heroicons collection
- **Images**: Nuxt Image for optimization

## Nuxt UI Component Library

The project uses **Nuxt UI v3** (`@nuxt/ui: ^3.3.4`) as the primary component library. All components are auto-imported and heavily customized via `app.config.ts` to match the ceramic design system.

### Core Nuxt UI Components

#### UButton

Button component with multiple variants and states.

**Props:**

- `color`: `primary` | `secondary` | `success` | `info` | `warning` | `error` | `neutral`
- `variant`: `solid` | `outline` | `soft` | `subtle` | `ghost` | `link`
- `size`: `xs` | `sm` | `md` | `lg` | `xl`
- `icon`: Icon name (e.g., `i-heroicons-plus`)
- `leading-icon` / `trailing-icon`: Position-specific icons
- `loading`: Show loading spinner
- `disabled`: Disable button
- `to`: Navigate to route (acts as link)
- `type`: `button` | `submit` | `reset`

**Usage:**

```vue
<UButton color="primary" variant="solid" size="md" icon="i-heroicons-plus" @click="handleClick">
  Add Product
</UButton>

<!-- Icon-only button -->
<UButton icon="i-heroicons-trash" variant="ghost" color="error" square aria-label="Delete" />

<!-- Button as link -->
<UButton to="/shop" variant="outline">
  View Shop
</UButton>
```

#### UCard

Container component with header, body, and footer sections.

**Props:**

- `variant`: `solid` | `outline` | `soft` | `subtle`

**Slots:**

- `header`: Card header content
- `default`: Card body content
- `footer`: Card footer content

**Usage:**

```vue
<UCard variant="outline">
  <template #header>
    <h3 class="text-ceramic-xl font-ceramic-display">Product Details</h3>
  </template>
  
  <p>Card content goes here</p>
  
  <template #footer>
    <div class="flex gap-ceramic-sm">
      <UButton>Save</UButton>
      <UButton variant="outline">Cancel</UButton>
    </div>
  </template>
</UCard>
```

#### UIcon

Display icons from Iconify or custom SVG components.

**Props:**

- `name`: Icon name (e.g., `i-heroicons-user`, `i-heroicons-shopping-cart`)
- `class`: Additional classes for sizing and styling

**Usage:**

```vue
<UIcon name="i-heroicons-home" class="!text-ceramic-xl text-clay-600" />
<UIcon name="i-heroicons-arrow-right" class="!text-ceramic-lg" />
```

**Icon Sizing:**

- Use `!text-ceramic-*` classes for consistent sizing
- Common sizes: `!text-ceramic-base`, `!text-ceramic-lg`, `!text-ceramic-xl`, `!text-ceramic-3xl`

#### UInput

Text input with icon and validation support.

**Props:**

- `v-model`: Bind to reactive value
- `type`: Input type (text, email, password, number, etc.)
- `placeholder`: Placeholder text
- `icon` / `leading-icon` / `trailing-icon`: Add icons
- `loading`: Show loading spinner
- `disabled`: Disable input
- `color`: `primary` | `error` | `neutral` (for validation states)
- `variant`: `outline` | `soft` | `subtle` | `ghost`
- `size`: `xs` | `sm` | `md` | `lg` | `xl`

**Slots:**

- `leading`: Custom leading content
- `trailing`: Custom trailing content (e.g., clear button)

**Usage:**

```vue
<UInput
  v-model="email"
  type="email"
  placeholder="Enter your email"
  icon="i-heroicons-at-sign"
  size="md"
/>

<!-- With trailing clear button -->
<UInput v-model="search" placeholder="Search..." icon="i-heroicons-magnifying-glass">
  <template #trailing>
    <UButton 
      v-if="search" 
      icon="i-heroicons-x-mark" 
      variant="ghost" 
      size="sm"
      @click="search = ''"
    />
  </template>
</UInput>
```

#### UForm

Form validation with schema support (Zod, Valibot, Yup, etc.).

**Props:**

- `state`: Reactive object with form data
- `schema`: Validation schema (Zod, Valibot, etc.)
- `validate`: Custom validation function
- `validate-on`: `['input', 'blur', 'change']` - When to validate
- `disabled`: Disable all form inputs

**Events:**

- `@submit`: Form submission (receives validated data)
- `@error`: Validation errors

**Exposed Methods:**

- `validate()`: Manually trigger validation
- `clear()`: Clear all errors
- `submit()`: Trigger form submission

**Usage:**

```vue
<script setup lang="ts">
import * as v from 'valibot';

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(2)),
  email: v.pipe(v.string(), v.email()),
});

const state = reactive({
  name: '',
  email: '',
});

async function onSubmit(event) {
  console.log('Validated data:', event.data);
}
</script>

<template>
  <UForm :state="state" :schema="schema" @submit="onSubmit">
    <UFormField label="Name" name="name" required>
      <UInput v-model="state.name" />
    </UFormField>

    <UFormField label="Email" name="email" required>
      <UInput v-model="state.email" type="email" />
    </UFormField>

    <UButton type="submit">Submit</UButton>
  </UForm>
</template>
```

#### UFormField

Wrapper for form inputs with label, validation, and help text.

**Props:**

- `name`: Field name (must match schema)
- `label`: Field label
- `description`: Help text below input
- `required`: Show required indicator
- `hint`: Hint text next to label
- `error`: Manual error message

**Usage:**

```vue
<UFormField
  label="Product Name"
  name="name"
  description="Enter a unique name for the product"
  required
>
  <UInput v-model="state.name" />
</UFormField>
```

#### USelect

Dropdown select component.

**Props:**

- `v-model`: Selected value
- `items`: Array of options (string[] or object[])
- `multiple`: Allow multiple selections
- `placeholder`: Placeholder text
- `disabled`: Disable select

**Usage:**

```vue
<USelect
  v-model="category"
  :items="['bowls', 'plates', 'vases', 'mugs']"
  placeholder="Select category"
/>

<!-- With objects -->
<USelect
  v-model="selectedOption"
  :items="[
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
  ]"
/>
```

#### UTextarea

Multi-line text input.

**Props:**

- `v-model`: Bind to reactive value
- `placeholder`: Placeholder text
- `rows`: Number of visible rows
- `disabled`: Disable textarea
- `variant`: `outline` | `soft` | `subtle` | `ghost`

**Usage:**

```vue
<UTextarea v-model="description" placeholder="Enter product description" :rows="4" />
```

#### UModal

Modal/dialog overlay component.

**Props:**

- `v-model`: Control modal visibility
- `title`: Modal title
- `description`: Modal description

**Slots:**

- `header`: Custom header
- `default`: Modal content
- `footer`: Modal footer

**Usage:**

```vue
<script setup>
const isOpen = ref(false);
</script>

<template>
  <UButton @click="isOpen = true">Open Modal</UButton>

  <UModal v-model="isOpen" title="Confirm Action">
    <p>Are you sure you want to proceed?</p>

    <template #footer>
      <div class="flex gap-ceramic-sm justify-end">
        <UButton variant="outline" @click="isOpen = false">Cancel</UButton>
        <UButton @click="confirmAction">Confirm</UButton>
      </div>
    </template>
  </UModal>
</template>
```

#### UDropdownMenu

Dropdown menu with items.

**Props:**

- `items`: Array of menu items with `label`, `icon`, `click`, etc.

**Usage:**

```vue
<UDropdownMenu
  :items="[
    [
      { label: 'Edit', icon: 'i-heroicons-pencil', click: () => edit() },
      { label: 'Delete', icon: 'i-heroicons-trash', click: () => remove() },
    ],
  ]"
>
  <UButton icon="i-heroicons-ellipsis-vertical" variant="ghost" />
</UDropdownMenu>
```

### Nuxt UI Customization Patterns

#### Using the `ui` Prop

Override component styles using the `ui` prop:

```vue
<UButton
  :ui="{
    base: 'font-bold rounded-full',
    label: 'uppercase',
  }"
>
  Custom Button
</UButton>

<UInput
  :ui="{
    base: 'border-2',
    trailing: 'pe-1',
  }"
/>
```

#### Using the `class` Prop

Add additional classes to the base element:

```vue
<UButton class="w-full shadow-lg">
  Full Width Button
</UButton>
```

#### Global Theming via app.config.ts

Customize default styles globally (already configured for ceramic theme):

```typescript
// app.config.ts
export default defineAppConfig({
  ui: {
    button: {
      slots: {
        base: 'rounded-md font-medium ...',
        label: 'truncate',
      },
      variants: {
        color: { primary: '...' },
        size: { md: { base: 'px-2.5 py-1.5 ...' } },
      },
      defaultVariants: {
        color: 'primary',
        variant: 'solid',
        size: 'md',
      },
    },
  },
});
```

### Ceramic Design System Integration

When using Nuxt UI components, always integrate with the ceramic design system:

**Colors:**

```vue
<!-- Map ceramic colors to Nuxt UI colors -->
<UButton color="primary">Clay Primary</UButton>
<UButton color="neutral">Stone Neutral</UButton>
```

**Spacing:**

```vue
<div class="flex gap-ceramic-sm">
  <UButton>Button 1</UButton>
  <UButton>Button 2</UButton>
</div>
```

**Typography:**

```vue
<UCard>
  <template #header>
    <h2 class="font-ceramic-display text-ceramic-2xl text-clay-800">
      Card Title
    </h2>
  </template>
</UCard>
```

**Icons:**

```vue
<!-- Always use ceramic icon sizing -->
<UIcon name="i-heroicons-home" class="!text-ceramic-xl text-clay-600" />
<UButton icon="i-heroicons-plus" class="hover:!text-clay-800" />
```

### Form Validation with Nuxt UI

The project should use schema validation with Zod or Valibot:

```vue
<script setup lang="ts">
import * as v from 'valibot';

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(2, 'Too short')),
  email: v.pipe(v.string(), v.email('Invalid email')),
  price: v.pipe(v.number(), v.minValue(0, 'Must be positive')),
});

const state = reactive({ name: '', email: '', price: 0 });
</script>

<template>
  <UForm :state="state" :schema="schema" @submit="handleSubmit">
    <UFormField label="Name" name="name">
      <UInput v-model="state.name" />
    </UFormField>

    <UFormField label="Email" name="email">
      <UInput v-model="state.email" type="email" />
    </UFormField>

    <UFormField label="Price" name="price">
      <UInput v-model="state.price" type="number" />
    </UFormField>

    <UButton type="submit">Save Product</UButton>
  </UForm>
</template>
```

### Accessibility with Nuxt UI

Always ensure accessibility when using Nuxt UI components:

```vue
<!-- Icon-only buttons need aria-label -->
<UButton
  icon="i-heroicons-trash"
  variant="ghost"
  aria-label="Delete product"
  @click="deleteProduct"
/>

<!-- Forms need proper labels -->
<UFormField label="Email" name="email" required>
  <UInput 
    v-model="email" 
    type="email"
    placeholder="your@email.com"
    aria-describedby="email-help"
  />
</UFormField>
```

## Key Design System Patterns

### Color Palette (Critical)

Always use these ceramic-inspired colors:

- **Primary**: `clay-*` (earth browns)
- **Secondary**: `sage-*` (natural greens)
- **Neutral**: `stone-*` (cool grays)
- **Background**: `cream-*` (warm off-whites)

Example: `bg-cream-25 text-clay-700 border-stone-300`

### Typography System

- **Display/Headers**: `font-ceramic-display` (Playfair Display)
- **Body Text**: `font-ceramic-sans` (Inter)
- **Sizes**: Use `text-ceramic-*` scale (xs, sm, base, lg, xl, 2xl, 3xl, 4xl, hero, title)

### Spacing & Layout

- **Custom Scale**: Use `*-ceramic-*` classes (xs: 8px, sm: 16px, md: 24px, lg: 32px, xl: 48px)
- **Example**: `px-ceramic-lg py-ceramic-md gap-ceramic-sm`
- **Component Sizes**: `size-ceramic-*` for consistent button/input heights

### Icons & Interactive Elements

- **Icons**: Use `UIcon` component with Heroicons (`i-heroicons-*`)
- **Hover States**: Always include `hover:!text-clay-800 hover:cursor-pointer` for interactive elements
- **Icon Sizing**: Use `!text-ceramic-xl` for consistent icon sizing
- **Transitions**: Add `transition-all duration-200` for smooth interactions

## Component Patterns

### File Structure

```
app/
├── components/
│   ├── common/           # Reusable UI components
│   └── layout/           # Layout-specific components
├── layouts/default.vue   # Main layout with AppHeader/AppFooter
├── pages/               # File-based routing
└── assets/css/main.css  # Design system definitions
```

### Component Naming

- **Layout Components**: `Layout*` prefix (e.g., `LayoutAppHeader`)
- **Common Components**: `Common*` prefix (e.g., `CommonHeroImageWrapper`)
- **Use PascalCase** for component names, auto-imported from `components/`

### Nuxt UI Customization

Components are heavily customized via `app.config.ts`:

- **Buttons**: Custom ceramic sizing and styling with clay/sage color variants
- **Inputs**: Ceramic border colors and focus states matching the design system
- **Cards**: Cream backgrounds with stone borders for cohesive aesthetic
- **Navigation**: Custom link styling with clay hover states and transitions
- **Forms**: Integrated validation styling with ceramic error colors

**Theming Strategy:**

1. Define ceramic color mappings in `app.config.ts`
2. Use `ui` prop for component-specific overrides
3. Apply ceramic utility classes for spacing and typography
4. Ensure all interactive states use ceramic colors (hover, focus, active)

### Image Handling

- **Use NuxtImg**: `<NuxtImg>` for all images with automatic optimization
- **Format**: Always specify `format="webp"` for modern browsers
- **Assets**: Store in `/public/image/` directory
- **Attributes**: Include `alt`, `loading="lazy"`, and responsive classes

## Development Workflow

### Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix linting issues
npm run format       # Prettier formatting
```

### Code Quality

- **Pre-commit hooks**: Automatically runs ESLint + Prettier via Husky
- **TypeScript**: Strict mode enabled, use proper typing
- **ESLint**: Extended Nuxt config with security and import rules

## Styling Guidelines

### CSS Architecture

1. **Design tokens** defined in `:root` of `main.css`
2. **Utility classes** for ceramic spacing/typography in `@layer utilities`
3. **Base styles** for typography hierarchy in `@layer base`
4. **Component overrides** via Nuxt UI theming in `app.config.ts`

### Class Naming Conventions

- **Ceramic utilities**: `*-ceramic-*` (spacing, typography, sizing)
- **Standard Tailwind**: Available but prefer ceramic variants
- **Nuxt UI**: Customized via slots in `app.config.ts`

### Responsive Design

- **Mobile-first**: Always start with mobile layouts
- **Breakpoints**: Use Tailwind's default breakpoints
- **Images**: Ensure responsive behavior with `object-cover`

## Common Code Patterns

### Vue Component Structure

```vue
<script setup lang="ts">
// Use Nuxt auto-imports (ref, computed, etc.)
// TypeScript interfaces for props
// Composables for shared logic
</script>

<template>
  <!-- Use ceramic design system classes -->
  <!-- Prefer Nuxt UI components with custom theming -->
</template>

<style scoped>
/* Minimal scoped styles - prefer utility classes */
</style>
```

### Navigation Items (see AppNavigation.vue)

```typescript
const items = ref<NavigationMenuItem[][]>([[{ label: 'Shop', to: '/shop' }]]);
```

### Layout Pattern

- **Main Layout**: Header → Main Content → Footer structure
- **Auto-imports**: Components from `components/` are automatically available
- **Slot-based**: Use `<slot />` for flexible content insertion

## Business Context

- **Industry**: Handmade ceramics and pottery
- **Aesthetic**: Artisanal, organic, earth-toned, warm and inviting
- **Target Audience**: Customers seeking unique, handcrafted ceramic pieces
- **Brand Values**: Craftsmanship, natural materials, timeless design

## Admin Dashboard System

The project includes a full-featured admin dashboard for managing products and hero images.

### Admin Components

#### AdminDashboardContent

Main admin dashboard wrapper component that renders the admin navigation.

**Usage:**

```vue
<AdminDashboardContent />
```

#### AdminNavigation

Navigation menu for switching between admin sections (Hero Images and Products).

**Navigation Items:**

- **Hero Images**: Manage landing and about page hero images (`/admin/hero-images`)
- **Products**: Manage product catalog and images (`/admin/products`)

**Usage:**

```vue
<AdminNavigation />
```

#### AdminPhotoManager

Navigation wrapper for hero image management pages with vertical menu and slot for content.

**Features:**

- Displays hero image navigation sidebar
- Provides slot for page-specific content
- Shows page title and recommendations

**Usage:**

```vue
<AdminPhotoManager>
  <AdminHeroImageContent :image="landingImage" page-type="landing" />
</AdminPhotoManager>
```

#### AdminHeroImageCard

Displays hero image metadata with loading/empty states.

**Props:**

- `image`: Hero image data (HeroImage | null)
- `pageLabel`: Display label for the page (string)
- `loading`: Loading state (boolean)

**Slots:**

- `actions`: Card header actions
- `footer`: Card footer content

**Displays:**

- Image dimensions (width x height)
- File size (formatted)
- Last updated timestamp

**Usage:**

```vue
<AdminHeroImageCard :image="landingImage" page-label="Landing" :loading="false">
  <template #actions>
    <UButton>Refresh</UButton>
  </template>
</AdminHeroImageCard>
```

#### AdminHeroImageContent

Container combining metadata card and image uploader. Delegates upload events to parent.

**Props:**

- `image`: Hero image data (HeroImage | null)
- `pageType`: Page type identifier (HeroImagePageType)
- `pageLabel`: Display label (string)
- `loading`: Loading state (boolean)

**Events:**

- `uploadSuccess`: Emitted after successful upload
- `uploadError`: Emitted on upload failure

**Usage:**

```vue
<AdminHeroImageContent
  :image="aboutImage"
  page-type="about"
  page-label="About"
  @upload-success="handleSuccess"
  @upload-error="handleError"
/>
```

#### AdminImageUploader

Full-featured image upload component with drag-and-drop, preview, validation, and progress tracking.

**Props:**

- `imageType`: 'hero' | 'product'
- `subType`: Hero page type or product slug (string)
- `maxSizeMB`: Maximum file size in MB (number, default: 5)
- `requiredWidth`: Target image width (number)
- `requiredHeight`: Target image height (number)
- `acceptedFormats`: Allowed MIME types (string[], default: jpeg, png, webp)
- `currentImageUrl`: URL of existing image (string)

**Events:**

- `uploadSuccess`: Returns upload result with publicUrl, key, dimensions, fileSize
- `uploadError`: Returns error message

**Features:**

- Drag-and-drop support
- Image preview
- Client-side validation
- Progress tracking
- Cloudflare R2 upload via presigned URLs
- WebP conversion and compression

**Usage:**

```vue
<AdminImageUploader
  image-type="hero"
  sub-type="landing"
  :max-size-m-b="10"
  :required-width="1920"
  :required-height="1080"
  @upload-success="handleUploadSuccess"
  @upload-error="handleUploadError"
/>
```

#### AdminProductForm

Comprehensive form for creating/editing ceramic products.

**Props:**

- `product`: Existing product data (ProductFormData)
- `mode`: 'create' | 'edit' (default: 'create')

**Events:**

- `submit`: Emits validated ProductFormData
- `cancel`: User cancelled form

**Form Fields:**

- **Basic Info**: Name, slug (auto-generated), description, price, category
- **Images**: Up to 3 product images with preview
- **Dimensions**: Height, width, depth (in cm)
- **Materials**: Multi-select dropdown
- **Status**: In stock toggle, featured toggle

**Validation:**

- Required: name, slug, price, category, at least one image
- Auto-generates slug from product name
- Price must be > 0
- Image validation (format, size)

**Usage:**

```vue
<AdminProductForm
  :product="existingProduct"
  mode="edit"
  @submit="handleSubmit"
  @cancel="handleCancel"
/>
```

#### AdminProductsProductCard

Product card displaying image, info, and action buttons.

**Props:**

- `product`: Product data with id, name, category, price, images, featured, in_stock
- `selected`: Selection state (boolean)

**Events:**

- `toggleSelection`: Toggle product selection
- `edit`: Edit product (passes product object)
- `delete`: Delete product (passes product id)

**Features:**

- Product image with fallback
- Featured badge
- Out of stock badge
- Selection checkbox
- Edit and delete buttons

**Usage:**

```vue
<AdminProductsProductCard
  :product="product"
  :selected="isSelected"
  @edit="handleEdit"
  @delete="handleDelete"
  @toggle-selection="toggleSelection"
/>
```

#### AdminProductsProductCatalogHeader

Header showing product count, selection status, and create button.

**Props:**

- `products`: Array of products
- `selectedProductIds`: Array of selected IDs

**Events:**

- `create`: Create new product

**Usage:**

```vue
<AdminProductsProductCatalogHeader
  :products="products"
  :selected-product-ids="selectedIds"
  @create="handleCreate"
/>
```

#### AdminProductsBulkActions

Bulk deletion buttons for selected products or all products.

**Props:**

- `selectedProductIds`: Array of selected product IDs

**Events:**

- `clearSelection`: Clear selection after deletion
- `refresh`: Refresh product list

**Actions:**

- **Delete All Products**: With double confirmation
- **Delete Selected**: Only enabled when products are selected

**Usage:**

```vue
<AdminProductsBulkActions
  :selected-product-ids="selectedIds"
  @clear-selection="clearSelection"
  @refresh="refreshProducts"
/>
```

#### AdminProductsCreateNewProduct

Empty state component shown when no products exist.

**Events:**

- `create`: User clicked create button

**Usage:**

```vue
<AdminProductsCreateNewProduct @create="handleCreate" />
```

### Common Components

#### CommonImageUploadDropzone

Drag-and-drop zone with upload instructions.

**Props:**

- `isDragging`: Dragging state (boolean)
- `acceptedFormats`: Allowed formats (string[])
- `maxSizeMB`: Max file size (number)
- `requiredWidth`: Target width (number)
- `requiredHeight`: Target height (number)

**Events:**

- Standard drag events (dragover, dragleave, drop)
- `click`: User clicked dropzone

#### CommonUploadProgressBar

Progress bar for upload operations.

**Props:**

- `progress`: Progress percentage (0-100)

**Features:**

- Animated progress bar
- Percentage display
- Ceramic styling

**Usage:**

```vue
<CommonUploadProgressBar :progress="uploadProgress" />
```

## Composables Library

### useImageUpload

Core composable for uploading images to Cloudflare R2 with compression and validation.

**Features:**

- Client-side image compression and WebP conversion
- Direct upload to R2 via presigned URLs
- Progress tracking
- Dimension validation
- Metadata storage in Supabase

**Usage:**

```typescript
const { uploadImage, progress, isUploading, error } = useImageUpload();

const result = await uploadImage(
  file,
  'hero', // or 'product'
  'landing', // subType
  {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
  }
);

// result: { publicUrl, key, width, height, fileSize, originalFileSize }
```

**Methods:**

- `uploadImage(file, imageType, subType, options)`: Upload and compress image
- `compressImage(file, maxWidth, maxHeight, quality)`: Compress to WebP
- `reset()`: Reset state
- `formatFileSize(bytes)`: Format bytes to KB/MB

### useImageUploaderLogic

Business logic for image uploader component with validation and file selection.

**Usage:**

```typescript
const {
  isDragging,
  previewUrl,
  selectedFile,
  validationError,
  progress,
  isUploading,
  handleDragOver,
  handleDrop,
  handleUpload,
  clearSelection,
} = useImageUploaderLogic(props, emit);
```

**Methods:**

- `validateFile(file)`: Validate file before upload
- `handleFileSelect(file)`: Process selected file
- `handleDragOver/Leave/Drop`: Drag-and-drop handlers
- `handleInputChange`: File input change handler
- `triggerFileInput()`: Programmatically open file dialog
- `handleUpload()`: Upload selected file
- `clearSelection()`: Clear selected file

### useHeroImages

Hero images data management with 5-minute smart caching.

**Features:**

- Fetches hero images from Supabase
- 5-minute cache to reduce API calls
- Force refresh after uploads
- Computed getters for landing/about images

**Usage:**

```typescript
const { landingImage, aboutImage, loading, fetchHeroImages, refreshImages } = useHeroImages({
  onError: (err) => toast.error(err),
  onSuccess: (msg) => toast.success(msg),
});

await fetchHeroImages(); // Uses cache if fresh
await refreshImages(); // Force refresh after upload
```

**Methods:**

- `fetchHeroImages(force)`: Fetch with caching
- `refreshImages()`: Force refresh
- `invalidate()`: Clear cache and refetch
- `getImage(pageType)`: Get specific image
- `clear()`: Clear all state

### useProductList

Fetch and manage product list from Supabase.

**Usage:**

```typescript
const { products, loading, fetchProducts, refreshProducts } = useProductList();

await fetchProducts();
```

**State:**

- `products`: Array of ProductRow
- `loading`: Fetch loading state

### useProductMutations

CRUD operations for products (Create, Update, Delete).

**Usage:**

```typescript
const { createProduct, updateProduct, deleteProduct } = useProductMutations();

await createProduct(productData);
await updateProduct(productId, productData);
await deleteProduct(productId);
```

**Features:**

- Toast notifications for success/error
- Automatic Supabase sync
- Confirmation dialogs for delete

### useProductDeletion

Bulk product deletion with confirmations.

**Usage:**

```typescript
const { deleteAllProducts, deleteSelectedProducts } = useProductDeletion();

await deleteAllProducts(); // Double confirmation
await deleteSelectedProducts([id1, id2]);
```

### useNotifications

Centralized toast notification system with predefined patterns.

**Usage:**

```typescript
const {
  notifySuccess,
  notifyError,
  notifyInfo,
  notifyWarning,
  notifyUploadSuccess,
  notifyUploadError,
  notifyFetchError,
} = useNotifications();

notifySuccess('Product Created', 'Your product was added successfully');
notifyUploadSuccess('landing');
notifyFetchError('Products', 'Failed to load products');
```

### useCaptcha

Clean hCaptcha integration for Nuxt 3.

**Features:**

- SSR-compatible
- Explicit rendering
- TypeScript support
- Simple API

**Usage:**

```typescript
const { token, render, reset, isLoaded } = useCaptcha();

await render('h-captcha-container', {
  sitekey: hcaptcha.siteKey,
  theme: 'light',
  size: 'normal',
});

// After form submission
reset();
```

### useContactFormValidation

Contact form validation, state management, and submission with hCaptcha.

**Usage:**

```typescript
const {
  form,
  loading,
  submitted,
  submitError,
  schema,
  hcaptcha,
  handleSubmit,
  resetForm,
  initializeCaptcha,
} = useContactFormValidation();

onMounted(() => initializeCaptcha());
```

**Features:**

- Zod/Valibot validation via shared schema
- hCaptcha integration and verification
- Auto-reset after 5 seconds on success
- Error handling with user-friendly messages

### useSupabase

Singleton Supabase client with TypeScript typing.

**Usage:**

```typescript
const supabase = useSupabase();

const { data, error } = await supabase.from('products').select('*');
```

**Features:**

- Typed client with Database schema
- Singleton pattern (one instance)
- Auto-configured from environment

## State Management Patterns

### Auth Store (Pinia)

Secure admin authentication with HttpOnly cookies and Supabase.

**Location:** `stores/auth.ts`

**Features:**

- HttpOnly cookies for token storage (XSS-protected)
- SSR-compatible authentication state
- Auto-logout on inactivity (handled by client plugin)
- Minimal localStorage (non-sensitive data only)

**State:**

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  lastActivity: number;
  isTabVisible: boolean;
  isLoading: boolean;
}
```

**Getters:**

- `currentUser`: Get sanitized user
- `isLoggedIn`: Check authentication status
- `userEmail`: Get user email
- `timeSinceActivity`: Time since last activity
- `isSessionExpiring`: Check if session about to expire

**Actions:**

- `signIn(credentials)`: Login with email/password
- `signOut()`: Logout and clear cookies
- `resetPassword(email)`: Send password reset email
- `resetActivity()`: Update last activity timestamp
- `setTabVisibility(isVisible)`: Track tab visibility
- `hydrateFromServer(user, isAuthenticated)`: SSR hydration

**Usage:**

```typescript
const authStore = useAuthStore();

// Sign in
const result = await authStore.signIn({
  email: 'admin@example.com',
  password: 'password123',
});

if (result.success) {
  // Navigate to dashboard
}

// Sign out
await authStore.signOut();

// Check auth status
if (authStore.isLoggedIn) {
  console.log('User:', authStore.currentUser);
}
```

### Store Persistence

Auth store uses Pinia persistence plugin but only persists non-sensitive data:

- ✅ `lastActivity` timestamp
- ❌ Tokens (stored in HttpOnly cookies)
- ❌ Sensitive user data

### Store Naming Conventions

- **Files**: Use kebab-case (e.g., `auth.ts`, `user-preferences.ts`)
- **Store IDs**: Use kebab-case matching filename
- **Composables**: Use `use*Store` pattern for consistency

## API Routes

### Contact Form API

**Endpoint:** `POST /api/contact`

**Location:** `server/api/contact.post.ts`

**Features:**

- hCaptcha verification
- Email validation
- Resend email service integration
- Rate limiting ready
- HTML email templates

**Request Body:**

```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  hcaptchaToken: string;
}
```

**Response:**

```typescript
{
  success: boolean;
  message: string;
  id?: string; // Resend email ID
}
```

**Error Codes:**

- `400`: Missing/invalid fields, captcha failed
- `500`: Email service error

### Admin Upload URL API

**Endpoint:** `POST /api/admin/upload-url`

**Location:** `server/api/admin/upload-url.post.ts`

**Features:**

- Generates presigned URLs for Cloudflare R2
- S3-compatible API
- File validation
- Metadata tracking

**Request Body:**

```typescript
{
  fileName: string;
  fileType: string; // MIME type
  fileSize: number;
  imageType: 'hero' | 'product';
  subType?: string; // Hero page or product slug
}
```

**Response:**

```typescript
{
  uploadUrl: string; // Presigned URL for upload
  publicUrl: string; // Public URL after upload
  key: string; // R2 object key
  expiresIn: number; // URL expiration (seconds)
  bucket: string; // Bucket name
}
```

**Image Storage Paths:**

- Hero images: `hero/{page}-{timestamp}.webp`
- Product images: `products/{slug}-{timestamp}.webp`

### Authentication APIs

#### Login

**Endpoint:** `POST /api/auth/login`

**Location:** `server/api/auth/login.post.ts`

**Features:**

- Supabase authentication
- HttpOnly cookie management
- Secure token storage

**Request Body:**

```typescript
{
  email: string;
  password: string;
}
```

**Response:**

```typescript
{
  success: boolean;
  user: User; // Sanitized user data
}
```

**Security:**

- Sets `ju_access_token` and `ju_refresh_token` HttpOnly cookies
- SameSite=lax for CSRF protection
- Secure flag in production

#### Logout

**Endpoint:** `POST /api/auth/logout`

**Location:** `server/api/auth/logout.post.ts`

**Features:**

- Invalidates Supabase session
- Clears auth cookies
- Safe to call when not authenticated

#### Get Current User

**Endpoint:** `GET /api/auth/me`

**Location:** `server/api/auth/me.get.ts`

**Features:**

- Validates session from cookies
- Refreshes tokens if needed
- Returns sanitized user data

**Response:**

```typescript
{
  user: User | null;
  isAuthenticated: boolean;
}
```

#### Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Location:** `server/api/auth/reset-password.post.ts`

**Features:**

- Sends password reset email via Supabase
- Configurable redirect URL

**Request Body:**

```typescript
{
  email: string;
}
```

## Authentication Pattern

Admin pages use **direct auth checks** in `<script setup>` instead of middleware:

```vue
<script setup lang="ts">
import { useAuthStore } from '~~/stores/auth';

// Auth check
const authStore = useAuthStore();
if (import.meta.client && !authStore.isLoggedIn) {
  await navigateTo('/admin');
}
</script>
```

**Why not middleware?**

- Avoids Nuxt middleware type generation issues (`MiddlewareKey = never`)
- More explicit and easier to debug
- Direct control over auth flow
- No TypeScript workarounds needed

**Security:**

- Auth state persisted in localStorage (user, isAuthenticated)
- Tokens stored in HttpOnly cookies (server-managed)
- Server validates all API requests via `/api/auth/me`
- Database has Row Level Security policies

## Shared Validation Schemas

### Admin Login Schema

**File:** `shared/adminLoginSchema.ts`

**Validation Rules:**

```typescript
{
  email: z.string().email().max(254),
  password: z.string()
    .min(8)
    .max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
}
```

**Requirements:**

- Valid email format
- Password 8-100 characters
- One uppercase, lowercase, number, special character

### Admin Password Reset Schema

**File:** `shared/adminPasswordResetSchema.ts`

**Validation Rules:**

```typescript
{
  newPassword: z.string()
    .min(8)
    .max(100)
    .regex(/[a-zA-Z]/) // Letter
    .regex(/[0-9]/) // Number
    .regex(/[A-Z]/) // Uppercase
    .regex(/[\W_]/), // Special char
  confirmPassword: z.string()
}
```

**Custom Refinement:**

- Passwords must match

### Contact Form Schema

**File:** `shared/contactFormSchema.ts`

**Validation Rules:**

```typescript
{
  firstName: z.string()
    .min(2).max(50)
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/),
  lastName: z.string()
    .min(2).max(50)
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/),
  email: z.string().email().max(254),
  message: z.string().min(10).max(2000)
}
```

**Custom Refinements:**

- All fields required (no blank submissions)
- Message cannot be only whitespace

## Configuration Files

### Hero Image Pages Config

**File:** `config/heroImagePages.ts`

**Purpose:** Centralized hero image page configuration

**Types:**

```typescript
type HeroImagePageType = 'landing' | 'about';

interface HeroImagePage {
  id: HeroImagePageType;
  label: string;
  icon: string;
  description: string;
  path?: string;
}
```

**Available Pages:**

```typescript
HERO_IMAGE_PAGES = [
  {
    id: 'landing',
    label: 'Landing Page',
    icon: 'i-heroicons-home',
    description: 'Main homepage hero image',
    path: '/admin/hero-images/landing',
  },
  {
    id: 'about',
    label: 'About Page',
    icon: 'i-heroicons-information-circle',
    description: 'About page hero image',
    path: '/admin/hero-images/about',
  },
];
```

**Upload Requirements:**

```typescript
HERO_IMAGE_CONFIG = {
  maxSizeMB: 10,
  requiredWidth: 1920,
  requiredHeight: 1080,
  acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  imageType: 'hero',
};
```

**Utility Functions:**

- `getHeroImagePage(id)`: Get page config by ID
- `getHeroImagePageLabel(id)`: Get page label by ID

## TypeScript Types

### Admin Types

**File:** `types/admin.ts`

**Product Types:**

```typescript
// From Supabase schema
export type ProductRow = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

// Form data
export interface ProductFormData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  dimensions: { height: number; width: number; depth: number };
  materials: string[];
  in_stock: boolean;
  featured: boolean;
}
```

**Hero Image Types:**

```typescript
export type HeroImageRow = Database['public']['Tables']['hero_images']['Row'];
export type HeroImageInsert = Database['public']['Tables']['hero_images']['Insert'];
export type HeroImageUpdate = Database['public']['Tables']['hero_images']['Update'];
```

**Helper Functions:**

```typescript
// Convert ProductRow to ProductFormData
productRowToFormData(product: ProductRow): ProductFormData;
```

### Supabase Database Types

**File:** `types/supabase.ts`

**Auto-generated** from Supabase schema, includes:

- All table types (Row, Insert, Update)
- JSON type definitions
- Database structure
- Helper type utilities

**Tables:**

- `products`: Ceramic product catalog
- `orders`: Customer orders
- `hero_images`: Page hero images

## Admin Pages

### Admin Dashboard Index

**Route:** `/admin`

**File:** `app/pages/admin/index.vue`

**Layout:** `admin` (no header/footer)

**Features:**

- Login form with Zod validation
- Password reset functionality
- Auth state management
- Auto-redirect after password reset
- Dashboard content when authenticated

**Components Used:**

- `AdminDashboardContent`
- `UForm`, `UInput`, `UButton` (Nuxt UI)

### Admin Products Page

**Route:** `/admin/products`

**File:** `app/pages/admin/products.vue`

**Layout:** `admin`

**Features:**

- Product catalog grid view
- Create/edit product modal
- Bulk selection and deletion
- Empty state handling
- SSR data fetching

**State Management:**

- `useProductList`: Fetch products
- `useProductMutations`: CRUD operations
- Local selection tracking

**Components Used:**

- `AdminProductForm`
- `AdminProductsProductCard`
- `AdminProductsProductCatalogHeader`
- `AdminProductsBulkActions`
- `AdminProductsCreateNewProduct`

### Admin Hero Images Pages

#### Landing Page Hero

**Route:** `/admin/hero-images/landing`

**File:** `app/pages/admin/hero-images/landing.vue`

**Layout:** `admin`

**Features:**

- Landing page hero image management
- Upload with preview
- Metadata display
- Smart caching (5-minute)

**Components Used:**

- `AdminPhotoManager`
- `AdminHeroImageContent`

#### About Page Hero

**Route:** `/admin/hero-images/about`

**File:** `app/pages/admin/hero-images/about.vue`

**Layout:** `admin`

**Features:**

- About page hero image management
- Same functionality as landing page
- Independent image management

**Components Used:**

- `AdminPhotoManager`
- `AdminHeroImageContent`

## Server Utilities

### Auth Helpers

**File:** `server/utils/auth-helpers.ts`

**Functions:**

- `sanitizeUser(user)`: Remove sensitive data from user object
- `clearAuthCookies(event)`: Clear all auth cookies
- `AUTH_COOKIE_OPTIONS`: Shared cookie configuration

**Cookie Options:**

```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
}
```

### Auth Utils

**File:** `server/utils/auth.ts`

**Functions:**

- `getSupabaseServer()`: Get server-side Supabase client
- Server-side session management helpers

## Client Plugins

### Auth Auto-Logout Plugin

**File:** `plugins/auth-auto-logout.client.ts`

**Features:**

- Monitors user activity (mouse, keyboard, scroll)
- Auto-logout after 30 minutes inactivity
- Tab visibility tracking
- Cross-tab logout synchronization
- LocalStorage event listeners

**Configuration:**

```typescript
AUTO_LOGOUT_CONFIG = {
  INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  ACTIVITY_CHECK_INTERVAL: 60 * 1000, // 1 minute
  LOGOUT_EVENT_KEY: 'ju_logout_event',
};
```

### Auth SSR Plugin

**File:** `plugins/auth-ssr.server.ts`

**Purpose:** Hydrate auth state from server

**Features:**

- Reads HttpOnly cookies on server
- Validates session with Supabase
- Populates auth store before client hydration
- Prevents auth flash/flicker

## Error Handling & Pages

### Error Pages

- **404 Page**: Create `error.vue` in app root with ceramic styling
- **Error Boundary**: Use `<NuxtErrorBoundary>` for component-level error handling
- **Loading States**: Use `<USpinner>` with ceramic colors for async operations

### Error Patterns

```vue
<template>
  <div class="min-h-screen bg-cream-25 flex items-center justify-center">
    <div class="text-center px-ceramic-lg">
      <h1 class="text-ceramic-4xl font-ceramic-display text-clay-800 mb-ceramic-md">
        Page Not Found
      </h1>
      <p class="text-ceramic-lg text-stone-600 mb-ceramic-lg">
        This page seems to have been fired in a different kiln.
      </p>
      <UButton to="/" variant="ceramic-primary"> Return Home </UButton>
    </div>
  </div>
</template>
```

## SEO & Meta Management

### Page Meta Patterns

```vue
<script setup lang="ts">
// Use Nuxt's composables for SEO
useSeoMeta({
  title: 'Handcrafted Ceramics | Ju Keramia',
  description: 'Discover unique, handmade ceramic pieces crafted with love and tradition.',
  ogImage: '/image/og-image.jpg',
  ogType: 'website',
});

// Structured data for e-commerce
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Ju Keramia',
        description: 'Handcrafted ceramics and pottery',
      }),
    },
  ],
});
</script>
```

### Meta Defaults

- **Site Name**: "Ju Keramia"
- **Default Description**: Focus on handcrafted, artisanal, unique ceramics
- **OG Images**: Store in `/public/image/og/` directory
- **Favicon**: Use ceramic-inspired icon in multiple formats

## Performance Optimization

### Image Optimization

```vue
<template>
  <!-- Product images with ceramic-specific optimization -->
  <NuxtImg
    :src="`/image/products/${product.slug}.jpg`"
    :alt="product.name"
    format="webp"
    quality="85"
    sizes="sm:100vw md:50vw lg:33vw"
    class="w-full h-64 object-cover rounded-ceramic-md"
    loading="lazy"
    placeholder
  />
</template>
```

### Bundle Optimization

- **Tree Shaking**: Import only needed Nuxt UI components
- **Image Formats**: Prefer WebP with JPEG fallback
- **Font Loading**: Use `font-display: swap` for ceramic fonts
- **Critical CSS**: Inline ceramic design tokens

## Accessibility Guidelines

### Ceramic Design System A11y

```vue
<template>
  <!-- Ensure sufficient contrast with ceramic colors -->
  <button
    class="bg-clay-600 text-cream-25 hover:bg-clay-700 focus:ring-2 focus:ring-clay-500 focus:ring-offset-2"
    :aria-label="buttonLabel"
    @click="handleAction"
  >
    <UIcon name="i-heroicons-shopping-bag" class="!text-ceramic-xl" aria-hidden="true" />
    <span class="sr-only">{{ screenReaderText }}</span>
  </button>
</template>
```

### A11y Patterns

- **Color Contrast**: Ensure 4.5:1 ratio minimum with ceramic colors
- **Focus States**: Use `focus:ring-clay-500` for ceramic focus indicators
- **Screen Readers**: Include `sr-only` text for icon-only buttons
- **ARIA Labels**: Provide context for ceramic-themed interactions
- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible

## API Integration Patterns

### Product Data Structure

```typescript
interface CeramicProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  category: 'bowls' | 'plates' | 'vases' | 'mugs' | 'decorative';
  dimensions: {
    height: number;
    width: number;
    depth: number;
  };
  materials: string[];
  inStock: boolean;
  featured: boolean;
}
```

### API Composables

```typescript
// composables/useProducts.ts
export const useProducts = () => {
  const { data: products, pending, error } = $fetch<CeramicProduct[]>('/api/products');

  const featuredProducts = computed(() => products.value?.filter((p) => p.featured) || []);

  return { products, featuredProducts, pending, error };
};
```

## Content Management

### Nuxt Content Patterns

```vue
<script setup lang="ts">
// For blog posts about ceramic techniques
const { data: posts } = await queryContent('/blog')
  .where({ featured: true })
  .sort({ date: -1 })
  .limit(3)
  .find();
</script>

<template>
  <div class="grid gap-ceramic-lg md:grid-cols-3">
    <article
      v-for="post in posts"
      :key="post._path"
      class="bg-cream-25 border border-stone-200 rounded-ceramic-lg p-ceramic-lg"
    >
      <NuxtLink :to="post._path" class="block group">
        <h3 class="font-ceramic-display text-ceramic-xl text-clay-800 group-hover:text-clay-900">
          {{ post.title }}
        </h3>
        <p class="text-stone-600 mt-ceramic-sm">
          {{ post.excerpt }}
        </p>
      </NuxtLink>
    </article>
  </div>
</template>
```

### Content Structure

```markdown
---
title: 'The Art of Ceramic Glazing'
excerpt: 'Discover the traditional techniques behind our unique glazes'
date: 2024-01-15
featured: true
category: 'techniques'
image: '/image/blog/glazing-techniques.jpg'
---

# Content with ceramic-themed examples
```

## Environment Configuration

### Environment Variables

```bash
# .env.local
NUXT_PUBLIC_SITE_URL=https://jukeramia.com
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
NUXT_STRIPE_SECRET_KEY=sk_...
NUXT_CONTENT_STUDIO_ENABLED=false
```

### Runtime Config

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    stripeSecretKey: process.env.NUXT_STRIPE_SECRET_KEY,
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      stripePublishableKey: process.env.NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    },
  },
});
```

## Testing Patterns

### Component Testing

```typescript
// tests/components/CommonHeroImageWrapper.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CommonHeroImageWrapper from '~/components/common/HeroImageWrapper.vue';

describe('CommonHeroImageWrapper', () => {
  it('renders with ceramic styling', () => {
    const wrapper = mount(CommonHeroImageWrapper, {
      props: { imageSrc: '/test-image.jpg', altText: 'Test' },
    });

    expect(wrapper.classes()).toContain('w-full');
    expect(wrapper.classes()).toContain('h-screen');
  });
});
```

### E2E Testing

```typescript
// tests/e2e/navigation.spec.ts
import { test, expect } from '@playwright/test';

test('ceramic navigation works correctly', async ({ page }) => {
  await page.goto('/');

  // Test ceramic-styled navigation
  await page.click('text=Shop');
  await expect(page).toHaveURL('/shop');

  // Test cart functionality with ceramic design
  await page.click('[aria-label="Cart"]');
  await expect(page.locator('.cart-dropdown')).toBeVisible();
});
```

// ...existing code...

When generating code, always maintain the ceramic aesthetic and ensure components feel cohesive with the existing design system. Follow the established patterns for component naming, file organization, and styling conventions.
