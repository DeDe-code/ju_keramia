<script setup lang="ts">
/**
 * Bulk actions component for deleting multiple or all products.
 * Emits events to parent for selection management and data refresh.
 */

import { useProductsStore } from '~~/stores/products';
import { useNotifications } from '~~/composables/useNotifications';

const productsStore = useProductsStore();
const { notifySuccess, notifyError, notifyWarning } = useNotifications();

defineProps<{
  selectedProductIds: string[];
}>();

const emit = defineEmits<{
  clearSelection: [];
  refresh: [];
}>();

const handleDeleteAllProducts = async () => {
  if (productsStore.products.length === 0) {
    notifyWarning('No Products', 'There are no products to delete');
    return;
  }

  const count = productsStore.products.length;
  const success = await productsStore.deleteAllProducts();

  if (success) {
    notifySuccess('All Products Deleted', `${count} product(s) deleted successfully`);
    productsStore.clearSelection();
    emit('clearSelection');
    emit('refresh');
  } else {
    notifyError('Delete Failed', productsStore.error || 'Failed to delete all products');
  }
};

const handleDeleteSelectedProducts = async () => {
  if (productsStore.selectedIds.length === 0) {
    notifyWarning('No Selection', 'Please select at least one product to delete');
    return;
  }

  const count = productsStore.selectedIds.length;
  const success = await productsStore.deleteSelectedProducts();

  if (success) {
    notifySuccess('Products Deleted', `${count} product(s) deleted successfully`);
    productsStore.clearSelection();
    emit('clearSelection');
    emit('refresh');
  } else {
    notifyError('Delete Failed', productsStore.error || 'Failed to delete selected products');
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
