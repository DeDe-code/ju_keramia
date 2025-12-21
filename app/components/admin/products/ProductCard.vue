<script setup lang="ts">
/**
 * Product card component displaying product info with selection, edit, and delete actions.
 * Shows product carousel with up to 3 images, featured/stock badges, and action buttons.
 */

const props = defineProps<{
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
    images?: string[];
    featured: boolean;
    in_stock: boolean;
  };
  selected?: boolean;
}>();

const emit = defineEmits<{
  toggleSelection: [productId: string];
  edit: [product: typeof props.product];
  delete: [productId: string];
}>();

const toggleProductSelection = () => {
  emit('toggleSelection', props.product.id);
};

const handleEditProduct = () => {
  emit('edit', props.product);
};

const handleDeleteProduct = () => {
  emit('delete', props.product.id);
};

// Prepare images array for carousel (max 3 images)
const carouselImages = computed(() => {
  if (!props.product.images || props.product.images.length === 0) {
    return [];
  }
  return props.product.images.slice(0, 3);
});

// Show carousel arrows/dots only if there are multiple images
const hasMultipleImages = computed(() => carouselImages.value.length > 1);
</script>

<template>
  <UCard>
    <template #header>
      <div class="aspect-square bg-stone-100 relative">
        <!-- Carousel for product images (max 3) -->
        <UCarousel
          v-if="carouselImages.length > 0"
          v-slot="{ item }"
          :items="carouselImages"
          :arrows="hasMultipleImages"
          :prev="{ color: 'neutral', variant: 'soft', size: 'xs' }"
          :next="{ color: 'neutral', variant: 'soft', size: 'xs' }"
          class="w-full h-full"
        >
          <img
            :src="item"
            :alt="`${product.name} - Product Image`"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </UCarousel>

        <!-- Fallback for products with no images -->
        <div v-else class="w-full h-full flex items-center justify-center text-stone-400">
          <UIcon name="i-heroicons-photo" class="!text-ceramic-4xl" />
        </div>

        <!-- Selection checkbox (top-right) -->
        <div class="absolute top-ceramic-sm right-ceramic-sm z-20">
          <UCheckbox :model-value="selected" @update:model-value="toggleProductSelection" />
        </div>

        <!-- Status badges -->
        <div
          v-if="product.featured"
          class="absolute top-ceramic-xs left-ceramic-xs bg-sage-600 text-cream-25 px-ceramic-xs py-0.5 rounded-ceramic-sm text-ceramic-xs font-medium z-10"
        >
          Featured
        </div>

        <div
          v-if="!product.in_stock"
          class="absolute bottom-ceramic-xs left-ceramic-xs bg-red-600 text-cream-25 px-ceramic-xs py-0.5 rounded-ceramic-sm text-ceramic-xs font-medium z-10"
        >
          Out of Stock
        </div>
      </div>
    </template>

    <template #footer>
      <h4
        class="font-ceramic-sans font-medium text-ceramic-base text-clay-800 mb-ceramic-xs truncate"
      >
        {{ product.name }}
      </h4>
      <div class="flex gap-ceramic-sm">
        <UButton size="sm" variant="outline" class="flex-1" @click="handleEditProduct">
          <UIcon name="i-heroicons-pencil" class="!text-ceramic-base mr-ceramic-xs" />
          Edit
        </UButton>
        <UButton
          size="sm"
          color="error"
          variant="outline"
          aria-label="Delete product"
          @click="handleDeleteProduct"
        >
          <UIcon name="i-heroicons-trash" class="!text-ceramic-base" />
        </UButton>
      </div>
    </template>
  </UCard>
</template>
