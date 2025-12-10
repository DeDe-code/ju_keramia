/**
 * Delete Product API Endpoint (Admin Only)
 *
 * Handles product deletion with proper authentication from HttpOnly cookies.
 */

export default defineEventHandler(async (event) => {
  try {
    // Read auth cookies
    const accessToken = getCookie(event, 'ju_access_token');
    const refreshToken = getCookie(event, 'ju_refresh_token');

    if (!accessToken) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized: No auth token found',
      });
    }

    // Get product ID from route params
    const productId = getRouterParam(event, 'id');

    if (!productId) {
      throw createError({
        statusCode: 400,
        message: 'Product ID is required',
      });
    }

    // Create authenticated Supabase client
    const supabase = getSupabaseServer();
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    });

    if (sessionError || !sessionData.user) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized: Invalid session',
      });
    }

    // Delete product with authenticated client
    const { error } = await supabase.from('products').delete().eq('id', productId);

    if (error) {
      console.error('Product deletion error:', error);
      throw createError({
        statusCode: 400,
        message: error.message || 'Failed to delete product',
      });
    }

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  } catch (error) {
    console.error('Product deletion API error:', error);

    const err = error as { statusCode?: number; message?: string };
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Failed to delete product',
    });
  }
});
