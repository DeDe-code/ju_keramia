<script setup lang="ts">
import { ref, computed } from 'vue';
import { useImageUpload } from '~~/composables/useImageUpload';
import type { ProductFormData } from '~~/types/admin';

/**
 * ProductForm Component
 *
 * Form for creating/editing products with:
 * - Basic product information (name, slug, description, price)
 * - 3 product images (800x800px recommended)
 * - Category selection
 * - Dimensions (height, width, depth)
 * - Materials (multiple selection)
 * - Stock status
 * - Featured flag
 */

interface Props {
  product?: ProductFormData;
  mode?: 'create' | 'edit';
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  product: undefined,
});

const emit = defineEmits<{
  submit: [product: ProductFormData];
  cancel: [];
}>();

// Toast notification
const toast = useToast();

// Image upload composable
const { uploadImage } = useImageUpload();

// Form state
const form = ref<ProductFormData>({
  name: props.product?.name || '',
  slug: props.product?.slug || '',
  description: props.product?.description || '',
  price: props.product?.price || 0,
  images: props.product?.images || [],
  category: props.product?.category || 'bowls',
  dimensions: props.product?.dimensions || { height: 0, width: 0, depth: 0 },
  materials: props.product?.materials || [],
  in_stock: props.product?.in_stock ?? true,
  featured: props.product?.featured ?? false,
});

// Category options
const categories = [
  { label: 'Bowls', value: 'bowls' },
  { label: 'Plates', value: 'plates' },
  { label: 'Vases', value: 'vases' },
  { label: 'Mugs', value: 'mugs' },
  { label: 'Decorative', value: 'decorative' },
];

// Material options (common ceramic materials)
const materialOptions = [
  { label: 'Porcelain', value: 'Porcelain' },
  { label: 'Stoneware', value: 'Stoneware' },
  { label: 'Earthenware', value: 'Earthenware' },
  { label: 'Terracotta', value: 'Terracotta' },
  { label: 'Glazed Ceramic', value: 'Glazed Ceramic' },
  { label: 'Unglazed Ceramic', value: 'Unglazed Ceramic' },
];

// Form validation state
const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

// Image handling - store File objects before upload
const selectedFiles = ref<File[]>([]);
const imagePreviewUrls = ref<string[]>([]);

// File input ref
const fileInputRef = ref<HTMLInputElement | null>(null);

/**
 * Generate slug from product name
 */
const generateSlug = () => {
  form.value.slug = form.value.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Handle file selection (multiple files, max 3)
 */
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files || []);

  if (files.length === 0) return;

  // Limit to 3 images
  if (files.length > 3) {
    toast.add({
      title: 'Too Many Files',
      description: 'Please select a maximum of 3 images',
      color: 'error',
    });
    return;
  }

  // Validate each file
  const validFiles: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    // Check file type
    if (!file.type.startsWith('image/')) {
      errors.push(`${file.name} is not an image`);
      continue;
    }

    // Check file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      errors.push(`${file.name} exceeds 5MB`);
      continue;
    }

    validFiles.push(file);
  }

  if (errors.length > 0) {
    toast.add({
      title: 'Invalid Files',
      description: errors.join(', '),
      color: 'error',
    });
  }

  if (validFiles.length === 0) return;

  // Store files
  selectedFiles.value = validFiles;

  // Create preview URLs
  imagePreviewUrls.value = validFiles.map((file) => URL.createObjectURL(file));
};

/**
 * Remove a selected image
 */
const removeSelectedImage = (index: number) => {
  // Revoke object URL to free memory
  if (imagePreviewUrls.value[index]) {
    URL.revokeObjectURL(imagePreviewUrls.value[index]);
  }

  selectedFiles.value.splice(index, 1);
  imagePreviewUrls.value.splice(index, 1);
};

/**
 * Trigger file input click
 */
const triggerFileInput = () => {
  fileInputRef.value?.click();
};

/**
 * Validate form
 */
const validateForm = (): boolean => {
  errors.value = {};

  if (!form.value.name.trim()) {
    errors.value.name = 'Product name is required';
  }

  if (!form.value.slug.trim()) {
    errors.value.slug = 'Slug is required';
  }

  if (form.value.price <= 0) {
    errors.value.price = 'Price must be greater than 0';
  }

  // Check if we have images (either uploaded already or selected files)
  const hasExistingImages = form.value.images.filter((img) => img).length > 0;
  const hasSelectedFiles = selectedFiles.value.length > 0;

  if (!hasExistingImages && !hasSelectedFiles) {
    errors.value.images = 'At least one product image is required';
  }

  if (!form.value.category) {
    errors.value.category = 'Category is required';
  }

  return Object.keys(errors.value).length === 0;
};

/**
 * Upload images to Cloudflare R2
 */
const uploadImages = async (): Promise<string[]> => {
  const uploadedUrls: string[] = [];

  for (let i = 0; i < selectedFiles.value.length; i++) {
    const file = selectedFiles.value[i];
    if (!file) continue;

    try {
      const result = await uploadImage(file, 'product', `product-${Date.now()}-${i}`);
      uploadedUrls.push(result.publicUrl);

      toast.add({
        title: 'Image Uploaded',
        description: `Image ${i + 1} of ${selectedFiles.value.length} uploaded`,
        color: 'success',
      });
    } catch (error) {
      throw new Error(
        `Failed to upload image ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return uploadedUrls;
};

/**
 * Handle form submission
 */
const handleSubmit = async () => {
  if (!validateForm()) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fix the errors in the form',
      color: 'error',
    });
    return;
  }

  isSubmitting.value = true;

  try {
    // Upload new images if any
    let imageUrls = form.value.images.filter((img) => img);

    if (selectedFiles.value.length > 0) {
      toast.add({
        title: 'Uploading Images',
        description: `Uploading ${selectedFiles.value.length} image(s)...`,
        color: 'info',
      });

      const newImageUrls = await uploadImages();
      imageUrls = [...imageUrls, ...newImageUrls];
    }

    // Create cleaned product with uploaded images
    const cleanedProduct = {
      ...form.value,
      images: imageUrls,
    };

    // Emit to parent component
    emit('submit', cleanedProduct);

    // Clean up object URLs
    imagePreviewUrls.value.forEach((url) => URL.revokeObjectURL(url));
    selectedFiles.value = [];
    imagePreviewUrls.value = [];

    // Success toast will be shown by parent component
  } catch (err) {
    toast.add({
      title: 'Error',
      description: err instanceof Error ? err.message : 'Failed to save product',
      color: 'error',
    });
    isSubmitting.value = false;
  }
};

/**
 * Handle cancel
 */
const handleCancel = () => {
  // Clean up object URLs
  imagePreviewUrls.value.forEach((url) => URL.revokeObjectURL(url));
  emit('cancel');
};

// Computed: Check if we have at least one image
const hasAtLeastOneImage = computed(() => {
  return form.value.images.some((img) => img) || selectedFiles.value.length > 0;
});
</script>

<template>
  <div class="w-full max-w-4xl">
    <!-- Header -->
    <div class="mb-ceramic-lg">
      <h3 class="font-ceramic-display text-ceramic-2xl text-clay-800 mb-ceramic-xs">
        {{ mode === 'create' ? 'Create New Product' : 'Edit Product' }}
      </h3>
      <p class="text-ceramic-base text-stone-600">
        Fill in the product details and upload up to 3 images
      </p>
    </div>

    <form class="space-y-ceramic-lg" @submit.prevent="handleSubmit">
      <!-- Basic Information Section -->
      <div
        class="bg-cream-25 border border-stone-200 rounded-ceramic-lg p-ceramic-lg space-y-ceramic-md"
      >
        <h4 class="font-ceramic-sans font-medium text-ceramic-lg text-clay-700 mb-ceramic-sm">
          Basic Information
        </h4>

        <!-- Product Name -->
        <div>
          <label class="block text-ceramic-sm font-medium text-clay-700 mb-ceramic-xs">
            Product Name *
          </label>
          <UInput
            v-model="form.name"
            size="lg"
            placeholder="Handcrafted Ceramic Bowl"
            class="w-full"
            :class="{ 'border-red-500': errors.name }"
            @blur="generateSlug"
          />
          <p v-if="errors.name" class="text-ceramic-sm text-red-600 mt-ceramic-xs">
            {{ errors.name }}
          </p>
        </div>

        <!-- Slug -->
        <div>
          <label class="block text-ceramic-sm font-medium text-clay-700 mb-ceramic-xs">
            URL Slug *
          </label>
          <UInput
            v-model="form.slug"
            size="lg"
            placeholder="handcrafted-ceramic-bowl"
            class="w-full"
            :class="{ 'border-red-500': errors.slug }"
          />
          <p class="text-ceramic-xs text-stone-500 mt-ceramic-xs">
            Auto-generated from product name. This will be used in the URL.
          </p>
          <p v-if="errors.slug" class="text-ceramic-sm text-red-600 mt-ceramic-xs">
            {{ errors.slug }}
          </p>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-ceramic-sm font-medium text-clay-700 mb-ceramic-xs">
            Description
          </label>
          <UTextarea
            v-model="form.description"
            :rows="4"
            placeholder="Describe your ceramic piece..."
            class="w-full"
          />
        </div>

        <!-- Price -->
        <div>
          <label class="block text-ceramic-sm font-medium text-clay-700 mb-ceramic-xs">
            Price (USD) *
          </label>
          <UInput
            v-model.number="form.price"
            type="number"
            step="0.01"
            min="0"
            size="lg"
            placeholder="49.99"
            class="w-full"
            :class="{ 'border-red-500': errors.price }"
          />
          <p v-if="errors.price" class="text-ceramic-sm text-red-600 mt-ceramic-xs">
            {{ errors.price }}
          </p>
        </div>

        <!-- Category -->
        <div>
          <label class="block text-ceramic-sm font-medium text-clay-700 mb-ceramic-xs">
            Category *
          </label>
          <USelectMenu
            v-model="form.category"
            :items="categories"
            value-key="value"
            size="lg"
            class="w-full"
            :class="{ 'border-red-500': errors.category }"
          />
          <p v-if="errors.category" class="text-ceramic-sm text-red-600 mt-ceramic-xs">
            {{ errors.category }}
          </p>
        </div>
      </div>

      <!-- Product Images Section -->
      <div
        class="bg-cream-25 border border-stone-200 rounded-ceramic-lg p-ceramic-lg space-y-ceramic-md"
      >
        <h4 class="font-ceramic-sans font-medium text-ceramic-lg text-clay-700 mb-ceramic-sm">
          Product Images
        </h4>
        <p class="text-ceramic-sm text-stone-600 -mt-ceramic-sm mb-ceramic-md">
          Select up to 3 images. Recommended size: 800x800px (square format). Images will be
          uploaded when you submit the form.
        </p>

        <!-- File Input (Hidden) -->
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="handleFileSelect"
        />

        <!-- Upload Button -->
        <div class="flex items-center gap-ceramic-md">
          <UButton
            type="button"
            size="lg"
            variant="outline"
            class="border-stone-300 text-clay-700 hover:bg-stone-100"
            :disabled="selectedFiles.length >= 3"
            @click="triggerFileInput"
          >
            <UIcon name="i-heroicons-photo" class="!text-ceramic-lg mr-ceramic-xs" />
            {{
              selectedFiles.length === 0 ? 'Select Images' : `Selected: ${selectedFiles.length}/3`
            }}
          </UButton>
          <span class="text-ceramic-xs text-stone-500">
            {{
              selectedFiles.length === 0
                ? 'No images selected'
                : `${selectedFiles.length} image(s) ready to upload`
            }}
          </span>
        </div>

        <!-- Image Previews -->
        <div
          v-if="imagePreviewUrls.length > 0"
          class="grid grid-cols-1 md:grid-cols-3 gap-ceramic-md mt-ceramic-md"
        >
          <div v-for="(previewUrl, index) in imagePreviewUrls" :key="index" class="relative group">
            <NuxtImg
              :src="previewUrl"
              :alt="`Preview ${index + 1}`"
              class="w-full h-48 object-cover rounded-ceramic-md border-2 border-stone-200"
              loading="lazy"
            />
            <div class="absolute top-2 right-2">
              <UButton
                size="xs"
                variant="solid"
                class="bg-red-600 hover:bg-red-700 text-white"
                @click="removeSelectedImage(index)"
              >
                <UIcon name="i-heroicons-x-mark" class="!text-ceramic-base" />
              </UButton>
            </div>
            <div
              class="absolute bottom-2 left-2 bg-clay-800/80 text-cream-25 px-2 py-1 rounded text-ceramic-xs"
            >
              Image {{ index + 1 }}
            </div>
          </div>
        </div>

        <!-- Existing Images (Edit Mode) -->
        <div v-if="form.images.length > 0 && mode === 'edit'" class="mt-ceramic-md">
          <p class="text-ceramic-sm font-medium text-clay-700 mb-ceramic-sm">Current Images</p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-ceramic-md">
            <div v-for="(imageUrl, index) in form.images" :key="index" class="relative">
              <NuxtImg
                :src="imageUrl"
                :alt="`Current ${index + 1}`"
                class="w-full h-48 object-cover rounded-ceramic-md border-2 border-stone-300"
                loading="lazy"
              />
              <div
                class="absolute bottom-2 left-2 bg-sage-700/80 text-cream-25 px-2 py-1 rounded text-ceramic-xs"
              >
                Current {{ index + 1 }}
              </div>
            </div>
          </div>
        </div>

        <p v-if="errors.images" class="text-ceramic-sm text-red-600">
          {{ errors.images }}
        </p>
      </div>

      <!-- Dimensions Section -->
      <div
        class="bg-cream-25 border border-stone-200 rounded-ceramic-lg p-ceramic-lg space-y-ceramic-md"
      >
        <h4 class="font-ceramic-sans font-medium text-ceramic-lg text-clay-700 mb-ceramic-sm">
          Dimensions (cm)
        </h4>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-ceramic-md">
          <div>
            <label class="block text-ceramic-sm font-medium text-clay-700 mb-ceramic-xs">
              Height
            </label>
            <UInput
              v-model.number="form.dimensions.height"
              type="number"
              step="0.1"
              min="0"
              size="lg"
              placeholder="10.5"
            />
          </div>

          <div>
            <label class="block text-ceramic-sm font-medium text-clay-700 mb-ceramic-xs">
              Width
            </label>
            <UInput
              v-model.number="form.dimensions.width"
              type="number"
              step="0.1"
              min="0"
              size="lg"
              placeholder="15.0"
            />
          </div>

          <div>
            <label class="block text-ceramic-sm font-medium text-clay-700 mb-ceramic-xs">
              Depth
            </label>
            <UInput
              v-model.number="form.dimensions.depth"
              type="number"
              step="0.1"
              min="0"
              size="lg"
              placeholder="15.0"
            />
          </div>
        </div>
      </div>

      <!-- Materials & Status Section -->
      <div
        class="bg-cream-25 border border-stone-200 rounded-ceramic-lg p-ceramic-lg space-y-ceramic-md"
      >
        <h4 class="font-ceramic-sans font-medium text-ceramic-lg text-clay-700 mb-ceramic-sm">
          Materials & Status
        </h4>

        <!-- Materials (Multi-select) -->
        <div>
          <label class="block text-ceramic-sm font-medium text-clay-700 mb-ceramic-xs">
            Materials
          </label>
          <USelectMenu
            v-model="form.materials"
            :items="materialOptions"
            value-key="value"
            multiple
            size="lg"
            class="w-full"
          />
          <p class="text-ceramic-xs text-stone-500 mt-ceramic-xs">
            Hold Ctrl/Cmd to select multiple materials
          </p>
        </div>

        <!-- Stock Status & Featured Toggles -->
        <div class="flex gap-ceramic-lg">
          <div class="flex items-center gap-ceramic-sm">
            <USwitch v-model="form.in_stock" />
            <label class="text-ceramic-sm font-medium text-clay-700"> In Stock </label>
          </div>

          <div class="flex items-center gap-ceramic-sm">
            <USwitch v-model="form.featured" />
            <label class="text-ceramic-sm font-medium text-clay-700"> Featured Product </label>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex justify-end gap-ceramic-sm pt-ceramic-md border-t border-stone-300">
        <UButton
          type="button"
          size="lg"
          variant="outline"
          class="px-ceramic-lg border-stone-300 text-stone-600 hover:bg-stone-100"
          :disabled="isSubmitting"
          @click="handleCancel"
        >
          Cancel
        </UButton>
        <UButton
          type="submit"
          size="lg"
          class="px-ceramic-lg bg-clay-700 hover:bg-clay-800 text-cream-25"
          :disabled="isSubmitting || !hasAtLeastOneImage"
          :loading="isSubmitting"
        >
          <UIcon
            v-if="!isSubmitting"
            name="i-heroicons-check"
            class="!text-ceramic-lg mr-ceramic-xs"
          />
          {{ mode === 'create' ? 'Create Product' : 'Update Product' }}
        </UButton>
      </div>
    </form>
  </div>
</template>
