/**
 * Login API Endpoint
 *
 * Handles admin authentication with Supabase and sets HttpOnly cookies.
 *
 * Security features:
 * - HttpOnly cookies for tokens (XSS protection)
 * - Secure flag in production
 * - SameSite=lax for CSRF protection
 * - 7-day token expiration
 * - Returns sanitized user data (no tokens in response body)
 */

import { sanitizeUser } from '../../utils/auth-helpers';

export default defineEventHandler(async (event) => {
  try {
    // Parse request body
    const body = await readBody(event);
    const { email, password } = body;

    if (!email || !password) {
      throw createError({
        statusCode: 400,
        message: 'Email and password are required',
      });
    }

    // Authenticate with Supabase
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      throw createError({
        statusCode: 401,
        message: error?.message || 'Invalid credentials',
      });
    }

    // Set HttpOnly cookies with tokens
    const cookieOptions = AUTH_COOKIE_OPTIONS;

    setCookie(event, 'ju_access_token', data.session.access_token, cookieOptions);
    setCookie(event, 'ju_refresh_token', data.session.refresh_token, cookieOptions);

    // Return sanitized user data (no tokens in response)
    return {
      success: true,
      user: sanitizeUser(data.user),
    };
  } catch (error) {
    console.error('Login error:', error);

    const err = error as { statusCode?: number; message?: string };
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Authentication failed',
    });
  }
});
