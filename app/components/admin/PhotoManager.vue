<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSupabase } from '~~/composables/useSupabase';
import type { Database } from '~~/types/supabase';

/**
 * PhotoManager Component
 *
 * Manages hero images for landing and about pages
 * - Displays current hero images
 * - Allows uploading new images
 * - Shows image metadata
 */

type HeroImage = Database['public']['Tables']['hero_images']['Row'];

// State
const landingImage = ref<HeroImage | null>(null);
const aboutImage = ref<HeroImage | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const activeTab = ref<'landing' | 'about'>('landing');

// Toast notification
const toast = useToast();

/**
 * Fetch current hero images from database
 */
const fetchHeroImages = async () => {
  loading.value = true;
  error.value = null;

  try {
    const supabase = useSupabase();

    const { data, error: fetchError } = await supabase
      .from('hero_images')
      .select('*')
      .in('page_type', ['landing', 'about']);

    if (fetchError) throw fetchError;

    if (data) {
      landingImage.value = data.find((img) => img.page_type === 'landing') || null;
      aboutImage.value = data.find((img) => img.page_type === 'about') || null;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load hero images';
    toast.add({
      title: 'Error',
      description: error.value,
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
};

/**
 * Handle successful upload
 */
const handleUploadSuccess = async (
  pageType: 'landing' | 'about',
  _result: {
    publicUrl: string;
    key: string;
    width: number;
    height: number;
    fileSize: number;
  }
) => {
  toast.add({
    title: 'Success',
    description: `${pageType === 'landing' ? 'Landing' : 'About'} page hero image uploaded successfully`,
    color: 'success',
  });

  // Refresh images
  await fetchHeroImages();
};

/**
 * Handle upload error
 */
const handleUploadError = (pageType: 'landing' | 'about', errorMsg: string) => {
  toast.add({
    title: 'Upload Failed',
    description: errorMsg,
    color: 'error',
  });
};

/**
 * Format file size for display
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Format date for display
 */
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Load images on mount
onMounted(() => {
  fetchHeroImages();
});
</script>

<template>
  <div class="w-full">
    <!-- Header -->
    <div class="mb-ceramic-lg">
      <h3 class="font-ceramic-display text-ceramic-2xl text-clay-800 mb-ceramic-xs">Hero Images</h3>
      <p class="text-ceramic-base text-stone-600">
        Manage hero images for landing and about pages. Recommended size: 1920x1080px
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-ceramic-xl">
      <UIcon name="i-heroicons-arrow-path" class="!text-ceramic-3xl text-clay-600 animate-spin" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-ceramic-md p-ceramic-md">
      <p class="text-ceramic-base text-red-700 flex items-start gap-ceramic-xs">
        <UIcon
          name="i-heroicons-exclamation-triangle"
          class="!text-ceramic-xl flex-shrink-0 mt-1"
        />
        <span>{{ error }}</span>
      </p>
      <UButton
        class="mt-ceramic-sm text-red-700 hover:text-red-800"
        variant="ghost"
        @click="fetchHeroImages"
      >
        Try Again
      </UButton>
    </div>

    <!-- Tabs -->
    <div v-else class="space-y-ceramic-lg">
      <div class="border-b border-stone-300">
        <div class="flex gap-ceramic-md">
          <button
            class="px-ceramic-md py-ceramic-sm font-ceramic-sans text-ceramic-lg transition-all duration-200 border-b-2"
            :class="[
              activeTab === 'landing'
                ? 'border-clay-600 text-clay-800 font-medium'
                : 'border-transparent text-stone-600 hover:text-clay-700 hover:border-stone-300',
            ]"
            @click="activeTab = 'landing'"
          >
            Landing Page
          </button>
          <button
            class="px-ceramic-md py-ceramic-sm font-ceramic-sans text-ceramic-lg transition-all duration-200 border-b-2"
            :class="[
              activeTab === 'about'
                ? 'border-clay-600 text-clay-800 font-medium'
                : 'border-transparent text-stone-600 hover:text-clay-700 hover:border-stone-300',
            ]"
            @click="activeTab = 'about'"
          >
            About Page
          </button>
        </div>
      </div>

      <!-- Landing Page Tab -->
      <div v-show="activeTab === 'landing'" class="space-y-ceramic-md">
        <!-- Current Image Info -->
        <div
          v-if="landingImage"
          class="bg-cream-25 border border-stone-200 rounded-ceramic-lg p-ceramic-md"
        >
          <h4 class="font-ceramic-sans font-medium text-ceramic-lg text-clay-700 mb-ceramic-sm">
            Current Landing Hero
          </h4>
          <div class="grid grid-cols-2 gap-ceramic-xs text-ceramic-sm">
            <div class="text-stone-600">Dimensions:</div>
            <div class="text-clay-800 font-medium">
              {{ landingImage.width }}x{{ landingImage.height }}px
            </div>

            <div class="text-stone-600">File Size:</div>
            <div class="text-clay-800 font-medium">
              {{ formatFileSize(landingImage.file_size) }}
            </div>

            <div class="text-stone-600">Last Updated:</div>
            <div class="text-clay-800 font-medium">{{ formatDate(landingImage.updated_at) }}</div>
          </div>
        </div>
        <div v-else class="bg-sage-50 border border-sage-200 rounded-ceramic-lg p-ceramic-md">
          <p class="text-ceramic-base text-sage-700 flex items-center gap-ceramic-xs">
            <UIcon name="i-heroicons-information-circle" class="!text-ceramic-xl" />
            No landing page hero image set
          </p>
        </div>

        <!-- Upload Component -->
        <AdminImageUploader
          image-type="hero"
          sub-type="landing"
          :max-size-m-b="10"
          :required-width="1920"
          :required-height="1080"
          :current-image-url="landingImage?.image_url"
          @upload-success="(result) => handleUploadSuccess('landing', result)"
          @upload-error="(error) => handleUploadError('landing', error)"
        />
      </div>

      <!-- About Page Tab -->
      <div v-show="activeTab === 'about'" class="space-y-ceramic-md">
        <!-- Current Image Info -->
        <div
          v-if="aboutImage"
          class="bg-cream-25 border border-stone-200 rounded-ceramic-lg p-ceramic-md"
        >
          <h4 class="font-ceramic-sans font-medium text-ceramic-lg text-clay-700 mb-ceramic-sm">
            Current About Hero
          </h4>
          <div class="grid grid-cols-2 gap-ceramic-xs text-ceramic-sm">
            <div class="text-stone-600">Dimensions:</div>
            <div class="text-clay-800 font-medium">
              {{ aboutImage.width }}x{{ aboutImage.height }}px
            </div>

            <div class="text-stone-600">File Size:</div>
            <div class="text-clay-800 font-medium">{{ formatFileSize(aboutImage.file_size) }}</div>

            <div class="text-stone-600">Last Updated:</div>
            <div class="text-clay-800 font-medium">{{ formatDate(aboutImage.updated_at) }}</div>
          </div>
        </div>
        <div v-else class="bg-sage-50 border border-sage-200 rounded-ceramic-lg p-ceramic-md">
          <p class="text-ceramic-base text-sage-700 flex items-center gap-ceramic-xs">
            <UIcon name="i-heroicons-information-circle" class="!text-ceramic-xl" />
            No about page hero image set
          </p>
        </div>

        <!-- Upload Component -->
        <AdminImageUploader
          image-type="hero"
          sub-type="about"
          :max-size-m-b="10"
          :required-width="1920"
          :required-height="1080"
          :current-image-url="aboutImage?.image_url"
          @upload-success="(result) => handleUploadSuccess('about', result)"
          @upload-error="(error) => handleUploadError('about', error)"
        />
      </div>
    </div>
  </div>
</template>
