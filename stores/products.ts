/**
 * Products Store - Centralized Product Management
 *
 * Using setup store syntax to avoid TypeScript deep instantiation errors
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useSupabase } from '../composables/useSupabase';
import type { ProductRow, ProductFormData } from '../types/admin';
import type { Json } from '../types/supabase';

export const useProductsStore = defineStore('products', () => {
  // ============================================
  // STATE
  // ============================================

  const products = ref<ProductRow[]>([]);
  const selectedIds = ref<string[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastFetch = ref<Date | null>(null);

  // ============================================
  // GETTERS
  // ============================================

  const featuredProducts = computed<ProductRow[]>(() => {
    const list: ProductRow[] = products.value;
    return list.filter((p) => p.featured);
  });

  const productsByCategory = computed(() => {
    const list: ProductRow[] = products.value;
    return (category: string) => list.filter((p) => p.category === category);
  });

  const productById = computed(() => {
    const list: ProductRow[] = products.value;
    return (id: string) => list.find((p) => p.id === id);
  });

  const productBySlug = computed(() => {
    const list: ProductRow[] = products.value;
    return (slug: string) => list.find((p) => p.slug === slug);
  });

  const inStockProducts = computed<ProductRow[]>(() => {
    const list: ProductRow[] = products.value;
    return list.filter((p) => p.in_stock);
  });

  const outOfStockProducts = computed<ProductRow[]>(() => {
    const list: ProductRow[] = products.value;
    return list.filter((p) => !p.in_stock);
  });

  const productsCount = computed(() => products.value.length);

  const selectedCount = computed(() => selectedIds.value.length);

  const hasSelection = computed(() => selectedIds.value.length > 0);

  const isStale = computed(() => {
    if (!lastFetch.value) return true;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - lastFetch.value.getTime() > fiveMinutes;
  });

  const hasProducts = computed(() => products.value.length > 0);

  const categories = computed<string[]>(() => {
    const list: ProductRow[] = products.value;
    const cats = new Set(list.map((p) => p.category));
    return Array.from(cats).sort();
  });

  // ============================================
  // HELPER: Toast Notifications
  // ============================================

  function showToast(
    title: string,
    description: string,
    color: 'success' | 'error' | 'warning' = 'success'
  ) {
    if (!import.meta.client) return;
    // @ts-expect-error - useToast is auto-imported by Nuxt UI
    const toast = globalThis.useToast();
    if (toast) {
      toast.add({ title, description, color });
    }
  }

  // ============================================
  // ACTIONS: Fetch Operations
  // ============================================

  async function fetchProducts(force = false): Promise<void> {
    // Smart caching: skip fetch if cache is fresh
    if (!force && !isStale.value && hasProducts.value) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const supabase = useSupabase();
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      products.value = data || [];
      lastFetch.value = new Date();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load products';
      error.value = errorMsg;
      showToast('Error', errorMsg, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function refreshProducts(): Promise<void> {
    return fetchProducts(true);
  }

  // ============================================
  // ACTIONS: Create Product
  // ============================================

  async function createProduct(productData: ProductFormData): Promise<boolean> {
    loading.value = true;
    error.value = null;

    if (!import.meta.client) return false;

    // Create temporary product for optimistic update
    const tempProduct: ProductRow = {
      id: `temp-${Date.now()}`,
      name: productData.name,
      slug: productData.slug,
      description: productData.description,
      price: productData.price,
      images: productData.images,
      category: productData.category,
      dimensions: productData.dimensions as Json,
      materials: productData.materials,
      in_stock: productData.in_stock,
      featured: productData.featured,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic update
    // @ts-expect-error - TypeScript deep type instantiation limitation
    products.value.unshift(tempProduct);

    try {
      const supabase = useSupabase();
      const { data, error: createError } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          price: productData.price,
          images: productData.images,
          category: productData.category,
          dimensions: productData.dimensions as Json,
          materials: productData.materials,
          in_stock: productData.in_stock,
          featured: productData.featured,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Replace temp product with real product
      const index = products.value.findIndex((p) => p.id === tempProduct.id);
      if (index !== -1 && data) {
        products.value[index] = data;
      }

      showToast('Success', `Product "${productData.name}" created successfully`);
      await refreshProducts();
      return true;
    } catch (err) {
      // Rollback optimistic update
      products.value = products.value.filter((p) => p.id !== tempProduct.id);

      const errorMsg = err instanceof Error ? err.message : 'Failed to create product';
      error.value = errorMsg;
      showToast('Error', errorMsg, 'error');
      return false;
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // ACTIONS: Update Product
  // ============================================

  async function updateProduct(id: string, productData: ProductFormData): Promise<boolean> {
    loading.value = true;
    error.value = null;

    if (!import.meta.client) return false;

    // Store original product for rollback
    const index = products.value.findIndex((p) => p.id === id);
    if (index === -1) {
      error.value = 'Product not found';
      loading.value = false;
      return false;
    }

    const originalProduct = { ...products.value[index] };

    // Optimistic update
    products.value[index] = {
      ...originalProduct,
      name: productData.name,
      slug: productData.slug,
      description: productData.description,
      price: productData.price,
      images: productData.images,
      category: productData.category,
      dimensions: productData.dimensions as Json,
      materials: productData.materials,
      in_stock: productData.in_stock,
      featured: productData.featured,
      updated_at: new Date().toISOString(),
    } as ProductRow;

    try {
      const supabase = useSupabase();
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          price: productData.price,
          images: productData.images,
          category: productData.category,
          dimensions: productData.dimensions as Json,
          materials: productData.materials,
          in_stock: productData.in_stock,
          featured: productData.featured,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      showToast('Success', `Product "${productData.name}" updated successfully`);
      await refreshProducts();
      return true;
    } catch (err) {
      // Rollback optimistic update
      products.value[index] = originalProduct as ProductRow;

      const errorMsg = err instanceof Error ? err.message : 'Failed to update product';
      error.value = errorMsg;
      showToast('Error', errorMsg, 'error');
      return false;
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // ACTIONS: Delete Single Product
  // ============================================

  async function deleteProduct(productId: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    if (!import.meta.client) return false;

    // Store original product for rollback
    const index = products.value.findIndex((p) => p.id === productId);
    if (index === -1) {
      error.value = 'Product not found';
      loading.value = false;
      return false;
    }

    const originalProduct = { ...products.value[index] };

    // Optimistic update
    products.value = products.value.filter((p) => p.id !== productId);
    selectedIds.value = selectedIds.value.filter((id) => id !== productId);

    try {
      const supabase = useSupabase();
      const { error: deleteError } = await supabase.from('products').delete().eq('id', productId);

      if (deleteError) throw deleteError;

      showToast('Success', `Product "${originalProduct.name}" deleted successfully`);
      return true;
    } catch (err) {
      // Rollback optimistic update
      products.value.splice(index, 0, originalProduct as ProductRow);
      if (!selectedIds.value.includes(productId)) {
        selectedIds.value.push(productId);
      }

      const errorMsg = err instanceof Error ? err.message : 'Failed to delete product';
      error.value = errorMsg;
      showToast('Error', errorMsg, 'error');
      return false;
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // ACTIONS: Delete Selected Products
  // ============================================

  async function deleteSelectedProducts(): Promise<boolean> {
    if (selectedIds.value.length === 0) {
      showToast('No Selection', 'Please select at least one product to delete', 'warning');
      return false;
    }

    loading.value = true;
    error.value = null;

    if (!import.meta.client) return false;

    // Store original products for rollback
    const productsToDelete = products.value.filter((p) => selectedIds.value.includes(p.id));
    const idsToDelete = [...selectedIds.value];

    // Optimistic update
    products.value = products.value.filter((p) => !selectedIds.value.includes(p.id));
    selectedIds.value = [];

    try {
      const supabase = useSupabase();
      const { error: deleteError } = await supabase.from('products').delete().in('id', idsToDelete);

      if (deleteError) throw deleteError;

      showToast('Success', `${idsToDelete.length} product(s) deleted successfully`);
      return true;
    } catch (err) {
      // Rollback optimistic update
      products.value = [...productsToDelete, ...products.value];
      selectedIds.value = idsToDelete;

      const errorMsg = err instanceof Error ? err.message : 'Failed to delete selected products';
      error.value = errorMsg;
      showToast('Error', errorMsg, 'error');
      return false;
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // ACTIONS: Delete All Products
  // ============================================

  async function deleteAllProducts(): Promise<boolean> {
    if (products.value.length === 0) {
      showToast('No Products', 'There are no products to delete', 'warning');
      return false;
    }

    loading.value = true;
    error.value = null;

    if (!import.meta.client) return false;

    // Store original products for rollback
    const originalProducts = [...products.value];

    // Optimistic update
    products.value = [];
    selectedIds.value = [];

    try {
      const supabase = useSupabase();
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Match all

      if (deleteError) throw deleteError;

      showToast('Success', 'All products deleted successfully');
      return true;
    } catch (err) {
      // Rollback optimistic update
      products.value = originalProducts;

      const errorMsg = err instanceof Error ? err.message : 'Failed to delete all products';
      error.value = errorMsg;
      showToast('Error', errorMsg, 'error');
      return false;
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // ACTIONS: Selection Management
  // ============================================

  function toggleSelection(productId: string): void {
    const index = selectedIds.value.indexOf(productId);
    if (index === -1) {
      selectedIds.value.push(productId);
    } else {
      selectedIds.value.splice(index, 1);
    }
  }

  function selectAll(): void {
    selectedIds.value = products.value.map((p) => p.id);
  }

  function clearSelection(): void {
    selectedIds.value = [];
  }

  function isSelected(productId: string): boolean {
    return selectedIds.value.includes(productId);
  }

  // ============================================
  // ACTIONS: Utility
  // ============================================

  function clearError(): void {
    error.value = null;
  }

  // Return everything
  return {
    // State
    products,
    selectedIds,
    loading,
    error,
    lastFetch,
    // Getters
    featuredProducts,
    productsByCategory,
    productById,
    productBySlug,
    inStockProducts,
    outOfStockProducts,
    productsCount,
    selectedCount,
    hasSelection,
    isStale,
    hasProducts,
    categories,
    // Actions
    fetchProducts,
    refreshProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteSelectedProducts,
    deleteAllProducts,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    clearError,
  };
});
