<script setup lang="ts">
/**
 * ImageUploadDropzone Component
 *
 * A reusable drag-and-drop upload zone with visual feedback and ceramic design system styling.
 * Provides an intuitive interface for file selection via drag & drop or click to browse.
 *
 * @component
 * @example
 * ```vue
 * <!-- Basic usage for image uploads -->
 * <CommonImageUploadDropzone
 *   :is-dragging="isDragging"
 *   :accepted-formats="['image/jpeg', 'image/png', 'image/webp']"
 *   :max-size-m-b="5"
 *   @dragover="handleDragOver"
 *   @dragleave="handleDragLeave"
 *   @drop="handleDrop"
 *   @click="triggerFileInput"
 * />
 *
 * <!-- With dimension requirements -->
 * <CommonImageUploadDropzone
 *   :is-dragging="isDragging"
 *   :accepted-formats="['image/jpeg']"
 *   :max-size-m-b="10"
 *   :required-width="1920"
 *   :required-height="1080"
 *   upload-text="Upload hero image"
 *   drag-text="Drop hero image here"
 *   @dragover="handleDragOver"
 *   @drop="handleDrop"
 *   @click="openFileBrowser"
 * />
 * ```
 *
 * @remarks
 * This component is presentation-only and doesn't handle file processing.
 * It emits events that parent components should handle for:
 * - Drag state management
 * - File validation
 * - File upload logic
 *
 * Can be used for:
 * - Image uploads (default)
 * - Document uploads (PDF, DOCX, etc.)
 * - Any file upload scenario
 *
 * Visual states:
 * - Default: Cream background with stone border
 * - Hover: Clay border highlight
 * - Dragging: Clay background with clay border
 */

interface Props {
  /**
   * Whether a file is currently being dragged over the zone
   * Controls the visual "drop here" state
   * @type {boolean}
   * @required
   */
  isDragging: boolean;

  /**
   * Array of accepted MIME types (e.g., 'image/jpeg', 'image/png')
   * Displayed to user as file extension requirements
   * @type {string[]}
   * @required
   * @example ['image/jpeg', 'image/png', 'image/webp']
   * @example ['application/pdf', 'application/msword']
   */
  acceptedFormats: string[];

  /**
   * Maximum allowed file size in megabytes
   * @type {number}
   * @required
   * @example 5 // 5MB limit
   * @example 10 // 10MB limit
   */
  maxSizeMB: number;

  /**
   * Optional recommended image width in pixels
   * Displayed as a hint to users if provided
   * @type {number}
   * @optional
   * @example 1920
   */
  requiredWidth?: number;

  /**
   * Optional recommended image height in pixels
   * Displayed as a hint to users if provided
   * @type {number}
   * @optional
   * @example 1080
   */
  requiredHeight?: number;

  /**
   * Text displayed in normal (non-dragging) state
   * @type {string}
   * @default 'Drag & drop or click to upload'
   */
  uploadText?: string;

  /**
   * Text displayed when file is being dragged over the zone
   * @type {string}
   * @default 'Drop image here'
   */
  dragText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  requiredWidth: undefined,
  requiredHeight: undefined,
  uploadText: 'Drag & drop or click to upload',
  dragText: 'Drop image here',
});

/**
 * Emitted events for parent component handling
 */
const emit = defineEmits<{
  /**
   * Emitted when a file is dragged over the dropzone
   * Parent should set isDragging to true and prevent default
   * @param e - DragEvent object
   */
  dragover: [e: DragEvent];

  /**
   * Emitted when drag leaves the dropzone
   * Parent should set isDragging to false
   */
  dragleave: [];

  /**
   * Emitted when a file is dropped in the zone
   * Parent should handle file validation and processing
   * @param e - DragEvent containing dropped files in dataTransfer
   */
  drop: [e: DragEvent];

  /**
   * Emitted when the dropzone is clicked
   * Parent should trigger file input dialog
   */
  click: [];
}>();

/**
 * Format MIME types into human-readable file extensions
 * Extracts the subtype (e.g., 'jpeg' from 'image/jpeg')
 * @returns Comma-separated uppercase extensions (e.g., 'JPEG, PNG, WEBP')
 */
const formatExtensions = () => {
  return props.acceptedFormats.map((f) => f.split('/')[1]?.toUpperCase() || '').join(', ');
};
</script>

<template>
  <!-- Main Dropzone Container
       - Dashed border for visual indication of drop zone
       - Cursor pointer to indicate clickability
       - Smooth transitions for state changes
       - Dynamic styling based on drag state
  -->
  <div
    class="border-2 border-dashed rounded-ceramic-md transition-all duration-200 cursor-pointer"
    :class="[
      isDragging
        ? 'border-clay-600 bg-clay-50' // Active drag state: Clay theme
        : 'border-stone-300 bg-cream-25 hover:border-clay-400', // Default/hover state
    ]"
    @dragover="emit('dragover', $event)"
    @dragleave="emit('dragleave')"
    @drop="emit('drop', $event)"
    @click="emit('click')"
  >
    <!-- Content Container with centered layout -->
    <div class="flex flex-col items-center justify-center py-ceramic-xl px-ceramic-md">
      <!-- Upload Icon
           - Cloud with arrow up icon from Heroicons
           - Large size for visual prominence
           - Neutral stone color
      -->
      <UIcon
        name="i-heroicons-cloud-arrow-up"
        class="!text-ceramic-4xl text-stone-400 mb-ceramic-sm"
      />

      <!-- Main Instruction Text
           - Changes based on drag state
           - Uses ceramic sans font for body text
           - Clay color for brand consistency
      -->
      <p class="text-ceramic-lg font-ceramic-sans text-clay-700 mb-ceramic-xs">
        {{ isDragging ? dragText : uploadText }}
      </p>

      <!-- File Format and Size Requirements
           - Displays accepted file types in uppercase
           - Shows maximum file size
           - Secondary text color for hierarchy
      -->
      <p class="text-ceramic-sm text-stone-500">{{ formatExtensions() }} up to {{ maxSizeMB }}MB</p>

      <!-- Optional Image Dimension Requirements
           - Only shown if requiredWidth AND requiredHeight are provided
           - Helps users prepare properly sized images
           - Additional spacing on top for visual separation
      -->
      <p
        v-if="requiredWidth && requiredHeight"
        class="text-ceramic-sm text-stone-500 mt-ceramic-xs"
      >
        Recommended: {{ requiredWidth }}x{{ requiredHeight }}px
      </p>
    </div>
  </div>
</template>
