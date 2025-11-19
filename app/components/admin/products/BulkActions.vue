<script setup lang="ts">
/**
 * Bulk actions component for deleting multiple or all products.
 * Emits events to parent for selection management and data refresh.
 */

import { useProductDeletion } from '~~/composables/useProductDeletion';

const { deleteAllProducts, deleteSelectedProducts } = useProductDeletion();

const props = defineProps<{
  selectedProductIds: string[];
}>();

const emit = defineEmits<{
  clearSelection: [];
  refresh: [];
}>();

const handleDeleteAllProducts = async () => {
  const success = await deleteAllProducts();
  if (success) {
    emit('clearSelection');
    emit('refresh');
  }
};

const handleDeleteSelectedProducts = async () => {
  const success = await deleteSelectedProducts(props.selectedProductIds);
  if (success) {
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
