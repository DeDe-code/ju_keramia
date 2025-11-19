import { useSupabase } from '~~/composables/useSupabase';

/**
 * Composable for handling product deletion operations
 *
 * Provides functions for:
 * - Deleting all products with confirmation
 * - Deleting selected products with confirmation
 */
export const useProductDeletion = () => {
  const supabase = useSupabase();
  const toast = useToast();

  /**
   * Delete all products from the database
   * @returns Promise resolving to success status
   */
  const deleteAllProducts = async (): Promise<boolean> => {
    const confirmed = confirm(
      'Are you sure you want to delete ALL products? This action cannot be undone!'
    );

    if (!confirmed) {
      return false;
    }

    // Double confirmation for safety
    const doubleConfirm = confirm(
      'This will permanently delete all products from your catalog. Are you absolutely sure?'
    );

    if (!doubleConfirm) {
      return false;
    }

    try {
      // Delete all products - no WHERE clause means all rows
      const { error } = await supabase
        .from('products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      toast.add({
        title: 'Success',
        description: 'All products deleted successfully',
        color: 'success',
      });

      return true;
    } catch (err) {
      toast.add({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete all products',
        color: 'error',
      });

      return false;
    }
  };

  /**
   * Delete selected products by their IDs
   * @param productIds - Array of product IDs to delete
   * @returns Promise resolving to success status
   */
  const deleteSelectedProducts = async (productIds: string[]): Promise<boolean> => {
    if (productIds.length === 0) {
      toast.add({
        title: 'No Selection',
        description: 'Please select at least one product to delete',
        color: 'warning',
      });
      return false;
    }

    const confirmed = confirm(
      `Are you sure you want to delete ${productIds.length} selected product${productIds.length !== 1 ? 's' : ''}? This action cannot be undone!`
    );

    if (!confirmed) {
      return false;
    }

    try {
      // Delete products where id is in the provided array
      const { error } = await supabase.from('products').delete().in('id', productIds);

      if (error) throw error;

      toast.add({
        title: 'Success',
        description: `${productIds.length} product${productIds.length !== 1 ? 's' : ''} deleted successfully`,
        color: 'success',
      });

      return true;
    } catch (err) {
      toast.add({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete selected products',
        color: 'error',
      });

      return false;
    }
  };

  return {
    deleteAllProducts,
    deleteSelectedProducts,
  };
};
