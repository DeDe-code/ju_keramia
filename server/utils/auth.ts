/**
 * Server Utilities for Auth
 *
 * Provides server-side only utilities for authentication operations.
 */

import type { H3Event } from 'h3';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~~/types/supabase';

/**
 * Get Supabase client for server-side operations
 * Creates a new client per request for isolation
 */
export const getSupabaseServer = (): SupabaseClient<Database> => {
  const config = useRuntimeConfig();
  const supabaseUrl = config.public.supabaseUrl;
  const supabaseKey = config.public.supabaseAnonKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and anon key must be set in environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseKey);
};

/**
 * Cookie configuration for auth tokens
 */
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60, // 7 days
  path: '/',
};

/**
 * Clear all auth cookies
 */
export const clearAuthCookies = (event: H3Event) => {
  deleteCookie(event, 'ju_access_token');
  deleteCookie(event, 'ju_refresh_token');
  deleteCookie(event, 'ju_session_id');
};
