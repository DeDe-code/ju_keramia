<script setup lang="ts">
/**
 * Bulk actions component for deleting multiple or all products.
 * Emits events to parent for selection management and data refresh.
 */

import { useProductsStore } from '~~/stores/products';

const productsStore = useProductsStore();

defineProps<{
  selectedProductIds: string[];
}>();

const emit = defineEmits<{
  clearSelection: [];
  refresh: [];
}>();

const handleDeleteAllProducts = async () => {
  const success = await productsStore.deleteAllProducts();
  if (success) {
    productsStore.clearSelection();
    emit('clearSelection');
    emit('refresh');
  }
};

const handleDeleteSelectedProducts = async () => {
  const success = await productsStore.deleteSelectedProducts();
  if (success) {
    productsStore.clearSelection();
    emit('clearSelection');
    emit('refresh');
  }
};
</script>
<template>
  <div>
    <UButton
      size="lg"
      variant="outline"
      class="bg-ceramic-error hover:bg-ceramic-errork text-cream-25 border-ceramic-error"
      @click="handleDeleteAllProducts"
    >
      <UIcon name="i-heroicons-trash" class="!text-ceramic-base mr-ceramic-xs" />
      Delete All Products
    </UButton>
    <UButton
      size="lg"
      variant="outline"
      class="bg-ceramic-error hover:bg-ceramic-error text-cream-25 border-ceramic-error"
      :disabled="selectedProductIds.length === 0"
      @click="handleDeleteSelectedProducts"
    >
      <UIcon name="i-heroicons-trash" class="!text-ceramic-base mr-ceramic-xs" />
      Delete Selected ({{ selectedProductIds.length }})
    </UButton>
  </div>
</template>
