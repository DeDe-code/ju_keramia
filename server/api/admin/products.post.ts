/**
 * Create Product API Endpoint (Admin Only)
 *
 * Handles product creation with proper authentication from HttpOnly cookies.
 * This allows the client to create products without exposing auth tokens.
 */

import type { Database } from '~~/types/supabase';

type ProductInsert = Database['public']['Tables']['products']['Insert'];

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
    const body = await readBody<ProductInsert>(event);

    // Insert product with authenticated client
    const { data, error } = await supabase.from('products').insert(body).select().single();

    if (error) {
      console.error('Product creation error:', error);
      throw createError({
        statusCode: 400,
        message: error.message || 'Failed to create product',
      });
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Product creation API error:', error);

    const err = error as { statusCode?: number; message?: string };
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Failed to create product',
    });
  }
});
