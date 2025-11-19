<script setup lang="ts">
import { ref } from 'vue';
import { useProductList } from '~~/composables/useProductList';
import { useProductMutations } from '~~/composables/useProductMutations';
import type { ProductRow, ProductFormData } from '~~/types/admin';
import { productRowToFormData } from '~~/types/admin';

// Use admin layout (no header/footer)
definePageMeta({
  layout: 'admin',
});

// Composables
const { products, loading, fetchProducts } = useProductList();
const { createProduct, updateProduct, deleteProduct } = useProductMutations();

// State
const showProductForm = ref(false);
const editingProduct = ref<ProductFormData | undefined>(undefined);
const selectedProductIds = ref<string[]>([]);

// Fetch products during SSR (prevents hydration mismatch)
await fetchProducts();

/**
 * Toggle product selection
 */
const toggleProductSelection = (productId: string) => {
  const index = selectedProductIds.value.indexOf(productId);
  if (index > -1) {
    selectedProductIds.value.splice(index, 1);
  } else {
    selectedProductIds.value.push(productId);
  }
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
    success = await updateProduct(editingProduct.value.id, product);
  } else {
    // Create new product
    success = await createProduct(product);
  }

  if (success) {
    // Refresh products and close form
    await fetchProducts();
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
  const success = await deleteProduct(productId);
  if (success) {
    await fetchProducts();
  }
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
        :products="products"
        :selected-product-ids="selectedProductIds"
        @create="handleCreateProduct"
      />

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-ceramic-xl">
        <UIcon name="i-heroicons-arrow-path" class="!text-ceramic-3xl text-clay-600 animate-spin" />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="products.length === 0"
        class="flex flex-col items-center justify-center py-ceramic-xl px-ceramic-md bg-cream-25 border-2 border-dashed border-stone-300 rounded-ceramic-lg"
      >
        <AdminProductsCreateNewProduct @create="handleCreateProduct" />
      </div>

      <!-- Product Grid -->
      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-ceramic-md">
          <AdminProductsProductCard
            v-for="product in products"
            :key="product.id"
            :product="{
              ...product,
              images: product.images ?? undefined,
            }"
            :selected="selectedProductIds.includes(product.id)"
            @edit="handleEditProduct"
            @delete="handleDeleteProduct"
            @toggle-selection="toggleProductSelection"
          />
        </div>

        <!-- Bulk Actions -->
        <div class="flex gap-ceramic-sm mt-ceramic-lg">
          <AdminProductsBulkActions
            v-if="selectedProductIds.length > 0"
            :selected-product-ids="selectedProductIds"
          />
        </div>
      </div>
    </div>
  </div>
</template>
