<script setup lang="ts">
import { ref } from 'vue';
import { useProductsStore } from '~~/stores/products';
import type { ProductRow, ProductFormData } from '~~/types/admin';
import { productRowToFormData } from '~~/types/admin';
import { useAuthStore } from '~~/stores/auth';

// Use admin layout (no header/footer)
definePageMeta({
  layout: 'admin',
});

// Auth check
const authStore = useAuthStore();
if (import.meta.client && !authStore.isLoggedIn) {
  await navigateTo('/admin');
}

// Products store
const productsStore = useProductsStore();

// State
const showProductForm = ref(false);
const editingProduct = ref<ProductFormData | undefined>(undefined);

// Fetch products during SSR (prevents hydration mismatch)
await productsStore.fetchProducts();

/**
 * Toggle product selection
 */
const toggleProductSelection = (productId: string) => {
  productsStore.toggleSelection(productId);
};

/** Show create product form **/
const handleCreateProduct = () => {
  editingProduct.value = undefined;
  showProductForm.value = true;
};

/**
 * Show edit product form
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleEditProduct = (product: any) => {
  editingProduct.value = productRowToFormData(product as ProductRow);
  showProductForm.value = true;
};

/**
 * Handle product form submission
 */
const handleProductSubmit = async (product: ProductFormData) => {
  let success = false;

  if (editingProduct.value?.id) {
    // Update existing product
    success = await productsStore.updateProduct(editingProduct.value.id, product);
  } else {
    // Create new product
    success = await productsStore.createProduct(product);
  }

  if (success) {
    // Close form
    showProductForm.value = false;
    editingProduct.value = undefined;
  }
};

/**
 * Handle product form cancel
 */
const handleProductCancel = () => {
  showProductForm.value = false;
  editingProduct.value = undefined;
};

/**
 * Handle product delete
 */
const handleDeleteProduct = async (productId: string) => {
  await productsStore.deleteProduct(productId);
};
</script>

<template>
  <div>
    <!-- Product Form View -->
    <div v-if="showProductForm">
      <AdminProductForm
        :product="editingProduct"
        :mode="editingProduct ? 'edit' : 'create'"
        @submit="handleProductSubmit"
        @cancel="handleProductCancel"
      />
    </div>

    <!-- Product List View -->
    <div v-else>
      <!-- Header -->
      <AdminProductsProductCatalogHeader
        :products="productsStore.products"
        :selected-product-ids="productsStore.selectedIds"
        @create="handleCreateProduct"
      />

      <!-- Loading State -->
      <div v-if="productsStore.loading" class="flex justify-center py-ceramic-xl">
        <UIcon name="i-heroicons-arrow-path" class="!text-ceramic-3xl text-clay-600 animate-spin" />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="productsStore.products.length === 0"
        class="flex flex-col items-center justify-center py-ceramic-xl px-ceramic-md bg-cream-25 border-2 border-dashed border-stone-300 rounded-ceramic-lg"
      >
        <AdminProductsCreateNewProduct @create="handleCreateProduct" />
      </div>

      <!-- Product Grid -->
      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-ceramic-md">
          <AdminProductsProductCard
            v-for="product in productsStore.products"
            :key="product.id"
            :product="{
              ...product,
              images: product.images ?? undefined,
            }"
            :selected="productsStore.isSelected(product.id)"
            @edit="handleEditProduct"
            @delete="handleDeleteProduct"
            @toggle-selection="toggleProductSelection"
          />
        </div>

        <!-- Bulk Actions -->
        <div class="flex gap-ceramic-sm mt-ceramic-lg">
          <AdminProductsBulkActions
            v-if="productsStore.hasSelection"
            :selected-product-ids="productsStore.selectedIds"
          />
        </div>
      </div>
    </div>
  </div>
</template>
