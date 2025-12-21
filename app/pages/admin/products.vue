<script setup lang="ts">
import { ref } from 'vue';
import { useProductsStore } from '~~/stores/products';
import { useNotifications } from '~~/composables/useNotifications';
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

// Products store and notifications
const productsStore = useProductsStore();
const { notifySuccess, notifyError, notifyFetchError } = useNotifications();

// State
const showProductForm = ref(false);
const editingProduct = ref<ProductFormData | undefined>(undefined);

// Fetch products during SSR (prevents hydration mismatch)
try {
  await productsStore.fetchProducts();
} catch (error) {
  if (import.meta.client) {
    notifyFetchError('Products', error instanceof Error ? error.message : undefined);
  }
}

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

  try {
    if (editingProduct.value?.id) {
      // Update existing product
      success = await productsStore.updateProduct(editingProduct.value.id, product);
      if (success) {
        notifySuccess('Product Updated', `"${product.name}" was updated successfully`);
      } else {
        notifyError('Update Failed', productsStore.error || 'Failed to update product');
      }
    } else {
      // Create new product
      success = await productsStore.createProduct(product);
      if (success) {
        notifySuccess('Product Created', `"${product.name}" was created successfully`);
      } else {
        notifyError('Create Failed', productsStore.error || 'Failed to create product');
      }
    }

    if (success) {
      // Close form
      showProductForm.value = false;
      editingProduct.value = undefined;
    }
  } catch (error) {
    notifyError('Error', error instanceof Error ? error.message : 'An unexpected error occurred');
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
  const product = productsStore.productById(productId);
  const productName = product?.name || 'Product';

  try {
    const success = await productsStore.deleteProduct(productId);
    if (success) {
      notifySuccess('Product Deleted', `"${productName}" was deleted successfully`);
    } else {
      notifyError('Delete Failed', productsStore.error || 'Failed to delete product');
    }
  } catch (error) {
    notifyError('Error', error instanceof Error ? error.message : 'An unexpected error occurred');
  }
};
</script>

<template>
  <UContainer>
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
        <div
          class="grid grid-cols-[repeat(auto-fill,minmax(200px,382px))] justify-center gap-ceramic-md"
        >
          <!-- Sticky Header -->
          <AdminProductsProductCatalogHeader
            :products="productsStore.products"
            :selected-product-ids="productsStore.selectedIds"
            @create="handleCreateProduct"
          />

          <!-- Product Cards -->
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

          <!-- Bulk Actions -->
          <div class="flex gap-ceramic-sm mt-ceramic-lg col-span-full">
            <AdminProductsBulkActions
              v-if="productsStore.hasSelection"
              :selected-product-ids="productsStore.selectedIds"
            />
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>
