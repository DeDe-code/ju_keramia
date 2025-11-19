<script setup lang="ts">
/**
 * Empty state component shown when no products exist.
 * Provides a call-to-action to create the first product.
 */

const emit = defineEmits<{
  create: [];
}>();

const handleCreateProduct = () => {
  emit('create');
};
</script>
<template>
  <div>
    <UIcon name="i-heroicons-cube" class="!text-ceramic-4xl text-stone-400 mb-ceramic-sm" />
    <h4 class="font-ceramic-sans text-ceramic-lg text-clay-700 mb-ceramic-xs">No products yet</h4>
    <p class="text-ceramic-sm text-stone-600 mb-ceramic-md">
      Create your first product to get started
    </p>
    <UButton
      size="lg"
      class="bg-clay-700 hover:bg-clay-800 text-cream-25"
      @click="handleCreateProduct"
    >
      <UIcon name="i-heroicons-plus" class="!text-ceramic-lg mr-ceramic-xs" />
      Create First Product
    </UButton>
  </div>
</template>
