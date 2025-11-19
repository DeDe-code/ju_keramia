<script setup lang="ts">
/**
 * Displays hero image metadata (dimensions, file size, last updated) with loading/empty states.
 */

import type { Database } from '~~/types/supabase';

type HeroImage = Database['public']['Tables']['hero_images']['Row'];

interface Props {
  image: HeroImage | null;
  pageLabel: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

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

const metadata = computed(() => {
  if (!props.image) return [];
  return [
    {
      label: 'Dimensions',
      value: `${props.image.width}x${props.image.height}px`,
      icon: 'i-heroicons-squares-2x2',
    },
    {
      label: 'File Size',
      value: formatFileSize(props.image.file_size),
      icon: 'i-heroicons-document',
    },
    {
      label: 'Last Updated',
      value: formatDate(props.image.updated_at),
      icon: 'i-heroicons-clock',
    },
  ];
});
</script>

<template>
  <div>
    <!-- Loading state -->
    <div
      v-if="loading"
      class="bg-cream-25 border border-stone-200 rounded-ceramic-lg p-ceramic-md flex justify-center items-center min-h-[120px]"
    >
      <UIcon name="i-heroicons-arrow-path" class="!text-ceramic-2xl text-clay-600 animate-spin" />
    </div>

    <!-- Image metadata card -->
    <div
      v-else-if="image"
      class="bg-cream-25 border border-stone-200 rounded-ceramic-lg p-ceramic-md"
    >
      <div class="flex items-center justify-between mb-ceramic-sm">
        <h4 class="font-ceramic-sans font-medium text-ceramic-lg text-clay-700">
          Current {{ pageLabel }} Hero
        </h4>
        <slot name="actions" />
      </div>

      <div class="space-y-ceramic-xs">
        <div
          v-for="item in metadata"
          :key="item.label"
          class="flex items-center justify-between text-ceramic-sm py-ceramic-xs"
        >
          <div class="flex items-center gap-ceramic-xs text-stone-600">
            <UIcon :name="item.icon" class="!text-ceramic-base" />
            <span>{{ item.label }}:</span>
          </div>
          <div class="text-clay-800 font-medium">{{ item.value }}</div>
        </div>
      </div>

      <slot name="footer" />
    </div>

    <!-- Empty state -->
    <div v-else class="bg-sage-50 border border-sage-200 rounded-ceramic-lg p-ceramic-md">
      <p class="text-ceramic-base text-sage-700 flex items-center gap-ceramic-xs">
        <UIcon name="i-heroicons-information-circle" class="!text-ceramic-xl flex-shrink-0" />
        <span>No {{ pageLabel.toLowerCase() }} page hero image set</span>
      </p>
    </div>
  </div>
</template>
