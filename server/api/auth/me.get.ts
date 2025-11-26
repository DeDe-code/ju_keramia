/**
 * Get Current User API Endpoint
 *
 * Returns the current authenticated user by reading and validating
 * the HttpOnly auth cookie.
 *
 * Used by client to:
 * - Check auth status after page load
 * - Refresh user data
 * - Validate session
 */

import { sanitizeUser } from '../../utils/auth-helpers';

export default defineEventHandler(async (event) => {
  try {
    // Read auth cookies
    const accessToken = getCookie(event, 'ju_access_token');
    const refreshToken = getCookie(event, 'ju_refresh_token');

    if (!accessToken) {
      return {
        user: null,
        isAuthenticated: false,
      };
    }

    // Validate session with Supabase
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    });

    if (error || !data.user) {
      // Invalid session - clear cookies
      deleteCookie(event, 'ju_access_token');
      deleteCookie(event, 'ju_refresh_token');

      return {
        user: null,
        isAuthenticated: false,
      };
    }

    // Update cookies if tokens were refreshed
    if (data.session) {
      if (data.session.access_token !== accessToken) {
        setCookie(event, 'ju_access_token', data.session.access_token, AUTH_COOKIE_OPTIONS);
      }

      if (data.session.refresh_token && data.session.refresh_token !== refreshToken) {
        setCookie(event, 'ju_refresh_token', data.session.refresh_token, AUTH_COOKIE_OPTIONS);
      }
    }

    // Return sanitized user data
    return {
      user: sanitizeUser(data.user),
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('Get user error:', error);

    return {
      user: null,
      isAuthenticated: false,
    };
  }
});
