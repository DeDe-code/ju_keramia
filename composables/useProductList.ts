import { ref } from 'vue';
import { useSupabase } from './useSupabase';
import type { ProductRow } from '../types/admin';

/**
 * Composable for fetching and managing product list
 */
export const useProductList = () => {
  const products = ref<ProductRow[]>([]);
  const loading = ref(false);
  const toast = useToast();

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
   * Refresh products (alias for fetchProducts)
   */
  const refreshProducts = () => fetchProducts();

  return {
    products,
    loading,
    fetchProducts,
    refreshProducts,
  };
};
