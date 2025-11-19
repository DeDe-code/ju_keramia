<script setup lang="ts">
/**
 * UploadProgressBar Component
 *
 * A reusable progress indicator for upload and async operations with ceramic design system styling.
 * Features smooth progress animation and customizable labels.
 *
 * @component
 * @example
 * ```vue
 * <!-- Basic usage -->
 * <CommonUploadProgressBar :progress="75" />
 *
 * <!-- Custom label -->
 * <CommonUploadProgressBar :progress="uploadProgress" label="Processing images..." />
 *
 * <!-- Hide percentage -->
 * <CommonUploadProgressBar :progress="50" :show-percentage="false" />
 * ```
 *
 * @remarks
 * This component can be used for:
 * - Image uploads (default use case)
 * - File uploads (documents, CSV, etc.)
 * - Bulk operations (batch processing, imports)
 * - Any async operation with trackable progress
 *
 * The progress bar uses ceramic colors (clay-600) for consistency with the design system.
 */

interface Props {
  /**
   * Current progress value (0-100)
   * @type {number}
   * @required
   * @example 75 // represents 75% completion
   */
  progress: number;

  /**
   * Label text displayed above the progress bar
   * @type {string}
   * @default 'Uploading...'
   * @example 'Processing files...'
   */
  label?: string;

  /**
   * Whether to display the percentage next to the label
   * @type {boolean}
   * @default true
   */
  showPercentage?: boolean;
}

withDefaults(defineProps<Props>(), {
  label: 'Uploading...',
  showPercentage: true,
});
</script>

<template>
  <div class="space-y-ceramic-xs">
    <!-- Label and Percentage Display -->
    <div class="flex justify-between text-ceramic-sm text-stone-600">
      <!-- Operation label (e.g., "Uploading...", "Processing...") -->
      <span>{{ label }}</span>

      <!-- Percentage indicator - hidden if showPercentage is false -->
      <span v-if="showPercentage">{{ progress }}%</span>
    </div>

    <!-- Progress Bar Container -->
    <div class="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
      <!-- Progress Fill Bar
           - Uses clay-600 for ceramic design consistency
           - Smooth transition animation (300ms)
           - Width controlled by progress prop (0-100%)
      -->
      <div
        class="bg-clay-600 h-full transition-all duration-300 rounded-full"
        :style="{ width: `${progress}%` }"
      />
    </div>
  </div>
</template>
