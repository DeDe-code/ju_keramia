<script setup lang="ts">
import { useHeroImagesStore } from '~~/stores/heroImages';
import { useNotifications } from '~~/composables/useNotifications';
import { HERO_IMAGE_CONFIG } from '~~/config/heroImagePages';
import { useAuthStore } from '~~/stores/auth';

/**
 * About Page Hero Image Management
 */

definePageMeta({
  layout: 'admin',
});

// Auth check
const authStore = useAuthStore();
if (import.meta.client && !authStore.isLoggedIn) {
  await navigateTo('/admin');
}

const { notifyUploadSuccess, notifyUploadError, notifyFetchError } = useNotifications();
const heroImagesStore = useHeroImagesStore();

const aboutImage = computed(() => heroImagesStore.aboutImage);

const handleUploadSuccess = async () => {
  notifyUploadSuccess('about');
  await heroImagesStore.refreshImages();
};

const handleUploadError = (errorMsg: string) => {
  notifyUploadError(errorMsg);
};

onMounted(async () => {
  try {
    await heroImagesStore.fetchHeroImages();
  } catch (error) {
    notifyFetchError('Hero Images', error instanceof Error ? error.message : undefined);
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
      <div v-if="heroImagesStore.loading" class="flex justify-center py-ceramic-xl">
        <UIcon name="i-heroicons-arrow-path" class="!text-ceramic-3xl text-clay-600 animate-spin" />
      </div>

      <!-- Error State -->
      <div
        v-else-if="heroImagesStore.error"
        class="bg-red-50 border border-red-200 rounded-ceramic-md p-ceramic-md"
      >
        <p class="text-ceramic-base text-red-700 flex items-start gap-ceramic-xs">
          <UIcon
            name="i-heroicons-exclamation-triangle"
            class="!text-ceramic-xl flex-shrink-0 mt-1"
          />
          <span>{{ heroImagesStore.error }}</span>
        </p>
        <UButton
          class="mt-ceramic-sm text-red-700 hover:text-red-800"
          variant="ghost"
          @click="() => heroImagesStore.fetchHeroImages(true)"
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
          :loading="heroImagesStore.loading"
          @upload-success="handleUploadSuccess"
          @upload-error="handleUploadError"
        />
      </div>
    </div>
  </AdminPhotoManager>
</template>
