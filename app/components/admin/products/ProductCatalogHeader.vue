<script setup lang="ts">
/**
 * Product catalog header showing total count, selection status, and create button.
 */

defineProps<{
  products: Array<{ id: string; name: string }>;
  selectedProductIds: string[];
}>();

const emit = defineEmits<{
  create: [];
}>();

const handleCreateProduct = () => {
  emit('create');
};
</script>

<template>
  <div class="flex justify-between items-center mb-ceramic-lg">
    <div>
      <h3 class="font-ceramic-display text-ceramic-xl text-clay-800">Product Catalog</h3>
      <p class="text-ceramic-sm text-stone-600 mt-ceramic-xs">
        {{ products.length }} product{{ products.length !== 1 ? 's' : '' }} total
        <span v-if="selectedProductIds.length > 0" class="text-clay-600 font-medium">
          • {{ selectedProductIds.length }} selected
        </span>
      </p>
    </div>
    <UButton
      v-if="products.length > 0"
      size="xl"
      class="p-4 bg-clay-700 hover:bg-clay-800 text-cream-25"
      @click="handleCreateProduct"
    >
      <UIcon name="i-heroicons-plus" class="!text-ceramic-lg mr-ceramic-xs" />
      New Product
    </UButton>
  </div>
</template>
