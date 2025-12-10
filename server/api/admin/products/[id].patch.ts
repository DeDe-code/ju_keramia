/**
 * Update Product API Endpoint (Admin Only)
 *
 * Handles product updates with proper authentication from HttpOnly cookies.
 */

import type { Database } from '~~/types/supabase';

type ProductUpdate = Database['public']['Tables']['products']['Update'];

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

    // Parse request body
    const body = await readBody<ProductUpdate>(event);

    // Update product with authenticated client
    const { data, error } = await supabase
      .from('products')
      .update(body)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Product update error:', error);
      throw createError({
        statusCode: 400,
        message: error.message || 'Failed to update product',
      });
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Product update API error:', error);

    const err = error as { statusCode?: number; message?: string };
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Failed to update product',
    });
  }
});
