<script setup lang="ts">
import { ref, computed } from 'vue';
import { useImageUpload } from '~~/composables/useImageUpload';

/**
 * ImageUploader Component
 *
 * Reusable drag-and-drop image uploader with:
 * - Visual drag & drop zone
 * - Click to browse
 * - Image preview
 * - Validation feedback
 * - Upload progress
 * - Ceramic design system styling
 */

interface Props {
  imageType: 'hero' | 'product';
  subType?: string;
  maxSizeMB?: number;
  requiredWidth?: number;
  requiredHeight?: number;
  acceptedFormats?: string[];
  currentImageUrl?: string;
}

const props = withDefaults(defineProps<Props>(), {
  subType: undefined,
  maxSizeMB: 5,
  requiredWidth: undefined,
  requiredHeight: undefined,
  acceptedFormats: () => ['image/jpeg', 'image/png', 'image/webp'],
  currentImageUrl: undefined,
});

const emit = defineEmits<{
  uploadSuccess: [
    result: {
      publicUrl: string;
      key: string;
      width: number;
      height: number;
      fileSize: number;
      originalFileSize: number;
    },
  ];
  uploadError: [error: string];
}>();

// Composable for upload logic
const { uploadImage, progress, isUploading, error: uploadError } = useImageUpload();

// Component state
const isDragging = ref(false);
const previewUrl = ref<string | null>(props.currentImageUrl || null);
const selectedFile = ref<File | null>(null);
const validationError = ref<string | null>(null);

// File input ref
const fileInput = ref<HTMLInputElement | null>(null);

// Format accepted types for input
const acceptString = computed(() => props.acceptedFormats.join(','));

/**
 * Validate file before upload
 */
const validateFile = (file: File): string | null => {
  // Check file type
  if (!props.acceptedFormats.includes(file.type)) {
    return `Invalid file type. Accepted: ${props.acceptedFormats.join(', ')}`;
  }

  // Check file size
  const maxBytes = props.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `File too large. Maximum size: ${props.maxSizeMB}MB`;
  }

  return null;
};

/**
 * Handle file selection
 */
const handleFileSelect = (file: File) => {
  validationError.value = validateFile(file);

  if (validationError.value) {
    return;
  }

  selectedFile.value = file;

  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

/**
 * Handle drag events
 */
const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = false;

  const files = e.dataTransfer?.files;
  if (files && files.length > 0 && files[0]) {
    handleFileSelect(files[0]);
  }
};

/**
 * Handle file input change
 */
const handleInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0 && files[0]) {
    handleFileSelect(files[0]);
  }
};

/**
 * Trigger file input click
 */
const triggerFileInput = () => {
  fileInput.value?.click();
};

/**
 * Upload the selected file
 */
const handleUpload = async () => {
  if (!selectedFile.value) return;

  validationError.value = null;

  try {
    const result = await uploadImage(
      selectedFile.value,
      props.imageType,
      props.subType,
      props.requiredWidth,
      props.requiredHeight
    );

    emit('uploadSuccess', result);

    // Keep preview showing the uploaded image
    previewUrl.value = result.publicUrl;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Upload failed';
    validationError.value = errorMessage;
    emit('uploadError', errorMessage);
  }
};

/**
 * Clear selection
 */
const clearSelection = () => {
  selectedFile.value = null;
  previewUrl.value = props.currentImageUrl || null;
  validationError.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};
</script>

<template>
  <div class="w-full">
    <!-- Upload Zone -->
    <div
      v-if="!previewUrl"
      class="border-2 border-dashed rounded-ceramic-md transition-all duration-200 cursor-pointer"
      :class="[
        isDragging
          ? 'border-clay-600 bg-clay-50'
          : 'border-stone-300 bg-cream-25 hover:border-clay-400',
      ]"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @click="triggerFileInput"
    >
      <div class="flex flex-col items-center justify-center py-ceramic-xl px-ceramic-md">
        <UIcon
          name="i-heroicons-cloud-arrow-up"
          class="!text-ceramic-4xl text-stone-400 mb-ceramic-sm"
        />
        <p class="text-ceramic-lg font-ceramic-sans text-clay-700 mb-ceramic-xs">
          {{ isDragging ? 'Drop image here' : 'Drag & drop or click to upload' }}
        </p>
        <p class="text-ceramic-sm text-stone-500">
          {{ props.acceptedFormats.map((f) => f.split('/')[1]?.toUpperCase() || '').join(', ') }} up
          to {{ maxSizeMB }}MB
        </p>
        <p
          v-if="requiredWidth && requiredHeight"
          class="text-ceramic-sm text-stone-500 mt-ceramic-xs"
        >
          Recommended: {{ requiredWidth }}x{{ requiredHeight }}px
        </p>
      </div>
    </div>

    <!-- Preview & Actions -->
    <div v-else class="space-y-ceramic-sm">
      <!-- Image Preview -->
      <div class="relative rounded-ceramic-md overflow-hidden bg-stone-100 border border-stone-300">
        <img :src="previewUrl" alt="Preview" class="w-full h-64 object-cover" />

        <!-- Remove button (only if not uploaded yet) -->
        <button
          v-if="selectedFile"
          class="absolute top-ceramic-xs right-ceramic-xs bg-stone-800/80 text-cream-25 p-ceramic-xs rounded-ceramic-sm hover:bg-stone-900 transition-all duration-200"
          @click.stop="clearSelection"
        >
          <UIcon name="i-heroicons-x-mark" class="!text-ceramic-lg" />
        </button>
      </div>

      <!-- File Info -->
      <div v-if="selectedFile" class="text-ceramic-sm text-stone-600">
        <p class="font-medium text-clay-700">{{ selectedFile.name }}</p>
        <p>{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</p>
      </div>

      <!-- Upload Button -->
      <div v-if="selectedFile && !isUploading" class="flex gap-ceramic-sm">
        <UButton
          size="lg"
          class="flex-1 bg-clay-700 hover:bg-clay-800 text-cream-25"
          @click="handleUpload"
        >
          <UIcon name="i-heroicons-arrow-up-tray" class="!text-ceramic-lg mr-ceramic-xs" />
          Upload Image
        </UButton>
        <UButton
          size="lg"
          variant="outline"
          class="border-stone-300 text-stone-600 hover:bg-stone-100"
          @click="clearSelection"
        >
          Cancel
        </UButton>
      </div>

      <!-- Progress Bar -->
      <div v-if="isUploading" class="space-y-ceramic-xs">
        <div class="flex justify-between text-ceramic-sm text-stone-600">
          <span>Uploading...</span>
          <span>{{ progress }}%</span>
        </div>
        <div class="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
          <div
            class="bg-clay-600 h-full transition-all duration-300 rounded-full"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>

      <!-- Change Image Button (after upload) -->
      <UButton
        v-if="!selectedFile && !isUploading"
        size="lg"
        variant="outline"
        class="w-full border-stone-300 text-clay-700 hover:bg-stone-100"
        @click="triggerFileInput"
      >
        <UIcon name="i-heroicons-arrow-path" class="!text-ceramic-lg mr-ceramic-xs" />
        Change Image
      </UButton>
    </div>

    <!-- Error Messages -->
    <div v-if="validationError || uploadError" class="mt-ceramic-sm">
      <div class="bg-red-50 border border-red-200 rounded-ceramic-sm p-ceramic-sm">
        <p class="text-ceramic-sm text-red-700 flex items-start gap-ceramic-xs">
          <UIcon
            name="i-heroicons-exclamation-triangle"
            class="!text-ceramic-lg flex-shrink-0 mt-0.5"
          />
          <span>{{ validationError || uploadError }}</span>
        </p>
      </div>
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      :accept="acceptString"
      class="hidden"
      @change="handleInputChange"
    />
  </div>
</template>
