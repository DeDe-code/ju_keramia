import { ref, computed, type Ref } from 'vue';
import { useImageUpload } from './useImageUpload';

/**
 * useImageUploaderLogic Composable
 *
 * Centralized business logic for image upload functionality.
 * Handles validation, file selection, drag events, and upload orchestration.
 *
 * @param props - Component props with upload configuration
 * @param emit - Component emit function for events
 * @returns All state and methods needed for image uploading
 */

interface ImageUploaderProps {
  imageType: 'hero' | 'product';
  subType?: string;
  maxSizeMB: number;
  requiredWidth?: number;
  requiredHeight?: number;
  acceptedFormats: string[];
  currentImageUrl?: string;
}

interface UploadSuccessResult {
  publicUrl: string;
  key: string;
  width: number;
  height: number;
  fileSize: number;
  originalFileSize: number;
}

interface ImageUploaderEmits {
  (event: 'uploadSuccess', result: UploadSuccessResult): void;
  (event: 'uploadError', error: string): void;
}

export const useImageUploaderLogic = (props: ImageUploaderProps, emit: ImageUploaderEmits) => {
  // External composable for actual upload
  const { uploadImage, progress, isUploading, error: uploadError } = useImageUpload();

  // Component state
  const isDragging = ref(false);
  const previewUrl = ref<string | null>(props.currentImageUrl || null);
  const selectedFile = ref<File | null>(null);
  const validationError = ref<string | null>(null);
  const fileInput: Ref<HTMLInputElement | null> = ref(null);

  // Computed values
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
   * Handle file selection and create preview
   */
  const handleFileSelect = (file: File) => {
    validationError.value = validateFile(file);

    if (validationError.value) {
      return;
    }

    selectedFile.value = file;

    // Create preview using FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
      previewUrl.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handle drag over event
   */
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = true;
  };

  /**
   * Handle drag leave event
   */
  const handleDragLeave = () => {
    isDragging.value = false;
  };

  /**
   * Handle drop event
   */
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = false;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0 && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  /**
   * Handle file input change event
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
      const result = await uploadImage(selectedFile.value, props.imageType, props.subType || '', {
        maxWidth: props.requiredWidth,
        maxHeight: props.requiredHeight,
      });

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
   * Clear selection and reset to initial state
   */
  const clearSelection = () => {
    selectedFile.value = null;
    previewUrl.value = props.currentImageUrl || null;
    validationError.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  };

  return {
    // State
    isDragging,
    previewUrl,
    selectedFile,
    validationError,
    fileInput,
    progress,
    isUploading,
    uploadError,
    acceptString,

    // Methods
    validateFile,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleInputChange,
    triggerFileInput,
    handleUpload,
    clearSelection,
  };
};
