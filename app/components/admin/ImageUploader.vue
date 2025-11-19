<script setup lang="ts">
/**
 * Image upload component with drag-and-drop, preview, validation, and progress tracking.
 * Supports hero and product image types with customizable size/format requirements.
 * Uses Cloudflare R2 for storage via useImageUpload composable.
 */

import { useImageUploaderLogic } from '~~/composables/useImageUploaderLogic';

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

const {
  isDragging,
  previewUrl,
  selectedFile,
  validationError,
  fileInput,
  progress,
  isUploading,
  uploadError,
  acceptString,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleInputChange,
  triggerFileInput,
  handleUpload,
  clearSelection,
} = useImageUploaderLogic(props, emit);
</script>

<template>
  <div class="w-full">
    <!-- Upload dropzone (shown when no file selected) -->
    <CommonImageUploadDropzone
      v-if="!previewUrl"
      :is-dragging="isDragging"
      :accepted-formats="props.acceptedFormats"
      :max-size-m-b="props.maxSizeMB"
      :required-width="props.requiredWidth"
      :required-height="props.requiredHeight"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @click="triggerFileInput"
    />

    <!-- Preview and actions (after file selection) -->
    <div v-else class="space-y-ceramic-sm">
      <div class="relative rounded-ceramic-md overflow-hidden bg-stone-100 border border-stone-300">
        <NuxtImg
          :src="previewUrl"
          alt="Preview"
          class="w-full h-64 object-cover"
          format="webp"
          loading="lazy"
        />

        <!-- Remove button (only for new selections) -->
        <button
          v-if="selectedFile"
          class="absolute top-ceramic-xs right-ceramic-xs bg-stone-800/80 text-cream-25 p-ceramic-xs rounded-ceramic-sm hover:bg-stone-900 transition-all duration-200"
          @click.stop="clearSelection"
        >
          <UIcon name="i-heroicons-x-mark" class="!text-ceramic-lg" />
        </button>
      </div>

      <!-- File info -->
      <div v-if="selectedFile" class="text-ceramic-sm text-stone-600">
        <p class="font-medium text-clay-700">{{ selectedFile.name }}</p>
        <p>{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</p>
      </div>

      <!-- Upload/Cancel buttons -->
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

      <!-- Progress bar -->
      <CommonUploadProgressBar v-if="isUploading" :progress="progress" />

      <!-- Change image button (after upload) -->
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

    <!-- Error messages -->
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

    <!-- Hidden file input -->
    <UFormField name="fileInput">
      <UInput
        ref="fileInput"
        type="file"
        :accept="acceptString"
        class="hidden"
        @change="handleInputChange"
      />
    </UFormField>
  </div>
</template>
