import { useSupabase } from './useSupabase';
import type { ProductFormData } from '../types/admin';

/**
 * Composable for product CRUD operations (Create, Update, Delete)
 */
export const useProductMutations = () => {
  const toast = useToast();
  const supabase = useSupabase();

  /**
   * Create a new product
   */
  const createProduct = async (product: ProductFormData) => {
    try {
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

      return true;
    } catch (err) {
      toast.add({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create product',
        color: 'error',
      });
      return false;
    }
  };

  /**
   * Update an existing product
   */
  const updateProduct = async (id: string, product: ProductFormData) => {
    try {
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
        .eq('id', id);

      if (error) throw error;

      toast.add({
        title: 'Success',
        description: 'Product updated successfully',
        color: 'success',
      });

      return true;
    } catch (err) {
      toast.add({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update product',
        color: 'error',
      });
      return false;
    }
  };

  /**
   * Delete a product
   */
  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return false;
    }

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);

      if (error) throw error;

      toast.add({
        title: 'Success',
        description: 'Product deleted successfully',
        color: 'success',
      });

      return true;
    } catch (err) {
      toast.add({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete product',
        color: 'error',
      });
      return false;
    }
  };

  return {
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
