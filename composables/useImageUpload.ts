import { ref } from 'vue';
import { useSupabase } from './useSupabase';

/**
 * Composable for uploading images to Cloudflare R2
 *
 * Handles:
 * - Image validation (type, size, dimensions)
 * - Client-side compression and WebP conversion
 * - Direct upload to R2 via presigned URLs
 * - Progress tracking
 * - Metadata storage in Supabase
 *
 * Usage:
 * const { uploadImage, progress, isUploading, error } = useImageUpload();
 * const result = await uploadImage(file, 'hero', 'landing');
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ImageUploadOptions {
  imageType: 'hero' | 'product';
  subType: string; // 'landing' | 'about' for hero, product slug for products
  maxWidth?: number; // Max width in pixels (default: 1920 for hero, 800 for product)
  maxHeight?: number; // Max height in pixels (default: 1080 for hero, 800 for product)
  quality?: number; // Compression quality 0-1 (default: 0.85)
}

export interface ImageUploadResult {
  publicUrl: string; // URL where image is accessible
  key: string; // R2 object key (path)
  width: number; // Final image width
  height: number; // Final image height
  fileSize: number; // Final file size in bytes
  originalFileSize: number; // Original file size before compression
}

export interface ImageValidationError {
  field: string;
  message: string;
}

// ============================================
// COMPOSABLE
// ============================================

export const useImageUpload = () => {
  // ============================================
  // STATE
  // ============================================
  const progress = ref<number>(0); // Upload progress 0-100
  const isUploading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const validationErrors = ref<ImageValidationError[]>([]);

  // ============================================
  // VALIDATION FUNCTIONS
  // ============================================

  /**
   * Validate file type
   */
  const validateFileType = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      validationErrors.value.push({
        field: 'fileType',
        message: `Invalid file type. Allowed: JPG, PNG, WebP. Got: ${file.type}`,
      });
      return false;
    }

    return true;
  };

  /**
   * Validate file size (before compression)
   */
  const validateFileSize = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB max before compression

    if (file.size > maxSize) {
      validationErrors.value.push({
        field: 'fileSize',
        message: `File too large. Maximum: 10MB. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      });
      return false;
    }

    return true;
  };

  /**
   * Validate image dimensions
   */
  const validateDimensions = async (
    file: File,
    _maxWidth: number,
    _maxHeight: number
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // We'll allow any dimensions since we resize anyway
        // Just warn if image is too small
        if (img.width < 400 || img.height < 400) {
          validationErrors.value.push({
            field: 'dimensions',
            message: `Image resolution is low (${img.width}x${img.height}). Recommended minimum: 800x800px`,
          });
        }

        resolve(true);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        validationErrors.value.push({
          field: 'dimensions',
          message: 'Failed to load image. File may be corrupted.',
        });
        resolve(false);
      };

      img.src = url;
    });
  };

  // ============================================
  // IMAGE COMPRESSION FUNCTIONS
  // ============================================

  /**
   * Compress and convert image to WebP format
   * This runs in the browser using Canvas API
   */
  const compressImage = async (
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.85
  ): Promise<{ blob: Blob; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // ============================================
        // CALCULATE NEW DIMENSIONS (MAINTAIN ASPECT RATIO)
        // ============================================
        let width = img.width;
        let height = img.height;

        // Calculate scaling to fit within max dimensions
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = Math.round(maxWidth / aspectRatio);
          } else {
            height = maxHeight;
            width = Math.round(maxHeight * aspectRatio);
          }
        }

        // ============================================
        // CREATE CANVAS AND DRAW RESIZED IMAGE
        // ============================================
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Use high-quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // ============================================
        // CONVERT TO WEBP BLOB
        // ============================================
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create compressed image'));
              return;
            }

            resolve({ blob, width, height });
          },
          'image/webp', // Convert to WebP format
          quality // Compression quality (0.85 = 85%)
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for compression'));
      };

      img.src = url;
    });
  };

  // ============================================
  // UPLOAD FUNCTIONS
  // ============================================

  /**
   * Main upload function
   *
   * @param file - File to upload
   * @param imageType - 'hero' or 'product'
   * @param subType - 'landing'/'about' for hero, product slug for products
   * @param options - Optional configuration
   */
  const uploadImage = async (
    file: File,
    imageType: 'hero' | 'product',
    subType: string,
    options: Partial<ImageUploadOptions> = {}
  ): Promise<ImageUploadResult> => {
    // Reset state
    error.value = null;
    validationErrors.value = [];
    progress.value = 0;
    isUploading.value = true;

    try {
      // ============================================
      // 1. DETERMINE TARGET DIMENSIONS
      // ============================================
      const maxWidth = options.maxWidth || (imageType === 'hero' ? 1920 : 800);
      const maxHeight = options.maxHeight || (imageType === 'hero' ? 1080 : 800);
      const quality = options.quality || 0.85;

      progress.value = 10; // Validation started

      // ============================================
      // 2. VALIDATE FILE
      // ============================================
      const isTypeValid = validateFileType(file);
      const isSizeValid = validateFileSize(file);
      const isDimensionsValid = await validateDimensions(file, maxWidth, maxHeight);

      if (!isTypeValid || !isSizeValid || !isDimensionsValid) {
        const errorMessage = validationErrors.value.map((e) => e.message).join('; ');
        throw new Error(errorMessage);
      }

      progress.value = 20; // Validation complete

      // ============================================
      // 3. COMPRESS IMAGE
      // ============================================
      const originalFileSize = file.size;

      const {
        blob: compressedBlob,
        width,
        height,
      } = await compressImage(file, maxWidth, maxHeight, quality);

      progress.value = 40; // Compression complete

      // Convert blob to File for upload
      const compressedFile = new File([compressedBlob], file.name, {
        type: 'image/webp',
      });

      console.log(
        `Compression: ${(originalFileSize / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB (${((1 - compressedFile.size / originalFileSize) * 100).toFixed(0)}% reduction)`
      );

      // ============================================
      // 4. REQUEST PRESIGNED URL FROM SERVER
      // ============================================
      progress.value = 50; // Requesting upload URL

      const response = await fetch('/api/admin/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: compressedFile.type,
          fileSize: compressedFile.size,
          imageType,
          subType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get upload URL: ${response.statusText}`);
      }

      const uploadUrlResponse: {
        uploadUrl: string;
        publicUrl: string;
        key: string;
        expiresIn: number;
        bucket: string;
      } = await response.json();

      if (!uploadUrlResponse || !uploadUrlResponse.uploadUrl) {
        throw new Error('Failed to get upload URL from server');
      }

      progress.value = 60; // Got upload URL

      // ============================================
      // 5. UPLOAD TO R2 USING PRESIGNED URL
      // ============================================
      const uploadResponse = await fetch(uploadUrlResponse.uploadUrl, {
        method: 'PUT',
        body: compressedFile,
        headers: {
          'Content-Type': compressedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      progress.value = 90; // Upload complete

      // ============================================
      // 6. SAVE METADATA TO SUPABASE (OPTIONAL)
      // ============================================
      // For hero images, save to hero_images table
      if (imageType === 'hero') {
        const supabase = useSupabase();

        const { error: dbError } = await supabase.from('hero_images').upsert(
          {
            page_type: subType, // 'landing' or 'about'
            image_url: uploadUrlResponse.publicUrl,
            cloudflare_key: uploadUrlResponse.key,
            alt_text: `${subType} page hero image`,
            width,
            height,
            file_size: compressedFile.size,
          },
          {
            onConflict: 'page_type', // Update if already exists
          }
        );

        if (dbError) {
          console.error('Failed to save hero image metadata:', dbError);
          // Don't fail the upload, just log the error
        }
      }

      // For product images, metadata will be saved when creating/updating product
      // (stored in products.images array)

      progress.value = 100; // Complete

      // ============================================
      // 7. RETURN RESULT
      // ============================================
      return {
        publicUrl: uploadUrlResponse.publicUrl,
        key: uploadUrlResponse.key,
        width,
        height,
        fileSize: compressedFile.size,
        originalFileSize,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      error.value = errorMessage;
      throw err;
    } finally {
      isUploading.value = false;
    }
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  /**
   * Reset state
   */
  const reset = () => {
    progress.value = 0;
    isUploading.value = false;
    error.value = null;
    validationErrors.value = [];
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // ============================================
  // RETURN PUBLIC API
  // ============================================
  return {
    // Main upload function
    uploadImage,

    // State
    progress,
    isUploading,
    error,
    validationErrors,

    // Utilities
    reset,
    formatFileSize,
    compressImage, // Expose for standalone use if needed
  };
};
