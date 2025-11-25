<script setup lang="ts">
import { useHeroImages } from '~~/composables/useHeroImages';
import { useNotifications } from '~~/composables/useNotifications';
import { useAdminAutoLogout } from '~~/composables/useAdminAutoLogout';
import { HERO_IMAGE_CONFIG } from '~~/config/heroImagePages';

/**
 * About Page Hero Image Management
 */

definePageMeta({
  layout: 'admin',
});

// Auto-logout for security
useAdminAutoLogout();

const { notifyUploadSuccess, notifyUploadError, notifyFetchError } = useNotifications();
const { getImage, loading, error, fetchHeroImages, refreshImages } = useHeroImages({
  onError: (err) => notifyFetchError('Hero Images', err),
});

const aboutImage = computed(() => getImage('about'));

const handleUploadSuccess = async () => {
  notifyUploadSuccess('about');
  await refreshImages();
};

const handleUploadError = (errorMsg: string) => {
  notifyUploadError(errorMsg);
};

onMounted(async () => {
  try {
    await fetchHeroImages();
  } catch {
    // Error already handled by composable
  }
});
</script>

<template>
  <AdminPhotoManager>
    <div class="w-full">
      <!-- Header -->
      <div class="mb-ceramic-lg">
        <h3 class="font-ceramic-display text-ceramic-2xl text-clay-800 mb-ceramic-xs">
          About Page Hero Image
        </h3>
        <p class="text-ceramic-base text-stone-600">
          Manage the about page hero image. Recommended size:
          {{ HERO_IMAGE_CONFIG.requiredWidth }}x{{ HERO_IMAGE_CONFIG.requiredHeight }}px
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-ceramic-xl">
        <UIcon name="i-heroicons-arrow-path" class="!text-ceramic-3xl text-clay-600 animate-spin" />
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="bg-red-50 border border-red-200 rounded-ceramic-md p-ceramic-md"
      >
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
          @click="() => fetchHeroImages(true)"
        >
          Try Again
        </UButton>
      </div>

      <!-- Content -->
      <div v-else>
        <AdminHeroImageContent
          :image="aboutImage"
          page-type="about"
          page-label="About"
          :loading="loading"
          @upload-success="handleUploadSuccess"
          @upload-error="handleUploadError"
        />
      </div>
    </div>
  </AdminPhotoManager>
</template>
