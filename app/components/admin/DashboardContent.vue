<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSupabase } from '~~/composables/useSupabase';
import type { ProductRow, ProductFormData } from '~~/types/admin';
import { productRowToFormData } from '~~/types/admin';

/**
 * AdminDashboardContent Component
 *
 * Main admin interface with tabbed sections for:
 * - Hero Images (PhotoManager)
 * - Products (ProductGallery + ProductForm)
 */

type TabName = 'hero-images' | 'products';

// State
const activeTab = ref<TabName>('hero-images');
const showProductForm = ref(false);
const editingProduct = ref<ProductFormData | undefined>(undefined);
const products = ref<ProductRow[]>([]);
const loading = ref(false);

// Toast
const toast = useToast();

/**
 * Tab configuration
 */
const tabs = [
  {
    name: 'hero-images' as TabName,
    label: 'Hero Images',
    icon: 'i-heroicons-photo',
    description: 'Manage landing and about page hero images',
  },
  {
    name: 'products' as TabName,
    label: 'Products',
    icon: 'i-heroicons-cube',
    description: 'Manage product catalog and images',
  },
];

/**
 * Get current tab info
 */
const currentTab = computed(() => {
  return tabs.find((tab) => tab.name === activeTab.value);
});

/**
 * Fetch products from database
 */
const fetchProducts = async () => {
  loading.value = true;

  try {
    const supabase = useSupabase();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    products.value = data || [];
  } catch (err) {
    toast.add({
      title: 'Error',
      description: err instanceof Error ? err.message : 'Failed to load products',
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
};

/**
 * Show create product form
 */
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
  try {
    const supabase = useSupabase();

    if (editingProduct.value?.id) {
      // Update existing product
      const { error } = await supabase
        .from('products')
        .update({
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          images: product.images,
          category: product.category,
          dimensions: product.dimensions,
          materials: product.materials,
          in_stock: product.in_stock,
          featured: product.featured,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingProduct.value.id);

      if (error) throw error;

      toast.add({
        title: 'Success',
        description: 'Product updated successfully',
        color: 'success',
      });
    } else {
      // Create new product
      const { error } = await supabase.from('products').insert([
        {
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          images: product.images,
          category: product.category,
          dimensions: product.dimensions,
          materials: product.materials,
          in_stock: product.in_stock,
          featured: product.featured,
        },
      ]);

      if (error) throw error;

      toast.add({
        title: 'Success',
        description: 'Product created successfully',
        color: 'success',
      });
    }

    // Refresh products and close form
    await fetchProducts();
    showProductForm.value = false;
    editingProduct.value = undefined;
  } catch (err) {
    toast.add({
      title: 'Error',
      description: err instanceof Error ? err.message : 'Failed to save product',
      color: 'error',
    });
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
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  try {
    const supabase = useSupabase();
    const { error } = await supabase.from('products').delete().eq('id', productId);

    if (error) throw error;

    toast.add({
      title: 'Success',
      description: 'Product deleted successfully',
      color: 'success',
    });

    await fetchProducts();
  } catch (err) {
    toast.add({
      title: 'Error',
      description: err instanceof Error ? err.message : 'Failed to delete product',
      color: 'error',
    });
  }
};

/**
 * Watch active tab and load data
 */
watch(activeTab, (newTab) => {
  if (newTab === 'products') {
    fetchProducts();
  }
});
</script>

<template>
  <div class="w-full">
    <!-- Tab Navigation -->
    <div class="mb-ceramic-xl border-b border-stone-300">
      <div class="flex gap-ceramic-md">
        <button
          v-for="tab in tabs"
          :key="tab.name"
          class="flex items-center gap-ceramic-xs px-ceramic-md py-ceramic-sm font-ceramic-sans text-ceramic-base transition-all duration-200 border-b-2"
          :class="[
            activeTab === tab.name
              ? 'border-clay-600 text-clay-800 font-medium'
              : 'border-transparent text-stone-600 hover:text-clay-700 hover:border-stone-300',
          ]"
          @click="activeTab = tab.name"
        >
          <UIcon :name="tab.icon" class="!text-ceramic-lg" />
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <!-- Tab Description -->
    <div class="mb-ceramic-lg">
      <p class="text-ceramic-base text-stone-600">
        {{ currentTab?.description }}
      </p>
    </div>

    <!-- Tab Content -->
    <div class="min-h-[600px]">
      <!-- Hero Images Tab -->
      <div v-show="activeTab === 'hero-images'">
        <AdminPhotoManager />
      </div>

      <!-- Products Tab -->
      <div v-show="activeTab === 'products'">
        <!-- Product Form (Create/Edit) -->
        <div v-if="showProductForm">
          <AdminProductForm
            :product="editingProduct"
            :mode="editingProduct ? 'edit' : 'create'"
            @submit="handleProductSubmit"
            @cancel="handleProductCancel"
          />
        </div>

        <!-- Product Gallery (List View) -->
        <div v-else>
          <div class="flex justify-between items-center mb-ceramic-lg">
            <div>
              <h3 class="font-ceramic-display text-ceramic-xl text-clay-800">Product Catalog</h3>
              <p class="text-ceramic-sm text-stone-600 mt-ceramic-xs">
                {{ products.length }} product{{ products.length !== 1 ? 's' : '' }} total
              </p>
            </div>
            <UButton
              size="lg"
              class="bg-clay-700 hover:bg-clay-800 text-cream-25"
              @click="handleCreateProduct"
            >
              <UIcon name="i-heroicons-plus" class="!text-ceramic-lg mr-ceramic-xs" />
              New Product
            </UButton>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="flex justify-center py-ceramic-xl">
            <UIcon
              name="i-heroicons-arrow-path"
              class="!text-ceramic-3xl text-clay-600 animate-spin"
            />
          </div>

          <!-- Empty State -->
          <div
            v-else-if="products.length === 0"
            class="flex flex-col items-center justify-center py-ceramic-xl px-ceramic-md bg-cream-25 border-2 border-dashed border-stone-300 rounded-ceramic-lg"
          >
            <UIcon name="i-heroicons-cube" class="!text-ceramic-4xl text-stone-400 mb-ceramic-sm" />
            <h4 class="font-ceramic-sans text-ceramic-lg text-clay-700 mb-ceramic-xs">
              No products yet
            </h4>
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

          <!-- Product Grid -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-ceramic-md">
            <div
              v-for="product in products"
              :key="product.id"
              class="bg-cream-25 border border-stone-200 rounded-ceramic-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <!-- Product Image -->
              <div class="aspect-square bg-stone-100 relative">
                <NuxtImg
                  v-if="product.images?.[0]"
                  :src="product.images[0]"
                  :alt="product.name"
                  class="w-full h-full object-cover"
                  format="webp"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-heroicons-photo" class="!text-ceramic-4xl text-stone-300" />
                </div>

                <!-- Featured Badge -->
                <div
                  v-if="product.featured"
                  class="absolute top-ceramic-xs right-ceramic-xs bg-sage-600 text-cream-25 px-ceramic-xs py-0.5 rounded-ceramic-sm text-ceramic-xs font-medium"
                >
                  Featured
                </div>

                <!-- Stock Badge -->
                <div
                  v-if="!product.in_stock"
                  class="absolute top-ceramic-xs left-ceramic-xs bg-red-600 text-cream-25 px-ceramic-xs py-0.5 rounded-ceramic-sm text-ceramic-xs font-medium"
                >
                  Out of Stock
                </div>
              </div>

              <!-- Product Info -->
              <div class="p-ceramic-sm">
                <h4
                  class="font-ceramic-sans font-medium text-ceramic-base text-clay-800 mb-ceramic-xs truncate"
                >
                  {{ product.name }}
                </h4>
                <p class="text-ceramic-sm text-stone-600 mb-ceramic-xs capitalize">
                  {{ product.category }}
                </p>
                <p class="text-ceramic-lg font-medium text-clay-700 mb-ceramic-sm">
                  ${{ product.price.toFixed(2) }}
                </p>

                <!-- Actions -->
                <div class="flex flex-col gap-ceramic-xs">
                  <UButton
                    size="sm"
                    variant="outline"
                    class="w-full md:w-[20rem] mx-auto px-ceramic-lg py-ceramic-sm bg-clay-700 hover:bg-stone-700 text-cream-25 rounded-none"
                    @click="handleEditProduct(product)"
                  >
                    <UIcon name="i-heroicons-pencil" class="!text-ceramic-base mr-ceramic-xs" />
                    Edit
                  </UButton>
                  <UButton
                    size="sm"
                    variant="outline"
                    class="w-full md:w-[20rem] mx-auto px-ceramic-lg py-ceramic-sm bg-clay-700 bg-ceramic-error text-cream-25 rounded-none"
                    @click="handleDeleteProduct(product.id!)"
                  >
                    <UIcon name="i-heroicons-trash" class="!text-ceramic-base" />
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
