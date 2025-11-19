<script setup lang="ts">
/**
 * Product card component displaying product info with selection, edit, and delete actions.
 * Shows product image, featured/stock badges, and action buttons.
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
</script>

<template>
  <div>
    <UCard>
      <template #header>
        <div class="aspect-square bg-stone-100 relative">
          <NuxtImg
            v-if="product.images?.[0]"
            :src="product.images[0]"
            alt="Product Image"
            class="w-full h-full object-cover"
            loading="lazy"
            format="webp"
            quality="80"
          />

          <!-- Selection checkbox (top-right) -->
          <div class="absolute top-ceramic-sm left-[21rem] z-10">
            <UCheckbox
              :model-value="selected"
              class="rounded-ceramic-xs p-1"
              @update:model-value="toggleProductSelection"
            />
          </div>

          <!-- Status badges -->
          <div
            v-if="product.featured"
            class="absolute top-ceramic-xs right-ceramic-xs bg-sage-600 text-cream-25 px-ceramic-xs py-0.5 rounded-ceramic-sm text-ceramic-xs font-medium"
          >
            Featured
          </div>

          <div
            v-if="!product.in_stock"
            class="absolute bottom-ceramic-xs left-ceramic-xs bg-red-600 text-cream-25 px-ceramic-xs py-0.5 rounded-ceramic-sm text-ceramic-xs font-medium"
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
  </div>
</template>
