<script setup lang="ts">
/**
 * Container combining HeroImageCard (metadata display) and ImageUploader.
 * Delegates upload events to parent component for handling.
 */

import type { Database } from '~~/types/supabase';
import type { HeroImagePageType } from '~~/config/heroImagePages';
import { HERO_IMAGE_CONFIG } from '~~/config/heroImagePages';

type HeroImage = Database['public']['Tables']['hero_images']['Row'];

interface Props {
  image: HeroImage | null;
  pageType: HeroImagePageType;
  pageLabel: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  uploadSuccess: [
    result: {
      publicUrl: string;
      key: string;
      width: number;
      height: number;
      fileSize: number;
    },
  ];
  uploadError: [error: string];
}>();
</script>

<template>
  <div class="space-y-ceramic-md">
    <!-- Current image metadata -->
    <AdminHeroImageCard :image="image" :page-label="pageLabel" :loading="loading">
      <template #actions>
        <slot name="card-actions" />
      </template>
    </AdminHeroImageCard>

    <!-- Image uploader -->
    <AdminImageUploader
      :image-type="HERO_IMAGE_CONFIG.imageType"
      :sub-type="props.pageType"
      :max-size-m-b="HERO_IMAGE_CONFIG.maxSizeMB"
      :required-width="HERO_IMAGE_CONFIG.requiredWidth"
      :required-height="HERO_IMAGE_CONFIG.requiredHeight"
      :current-image-url="props.image?.image_url"
      @upload-success="emit('uploadSuccess', $event)"
      @upload-error="emit('uploadError', $event)"
    />
  </div>
</template>
