/**
 * Logout API Endpoint
 *
 * Handles admin logout by:
 * 1. Invalidating Supabase session
 * 2. Clearing HttpOnly auth cookies
 *
 * Security:
 * - Clears all auth cookies
 * - Invalidates server-side session
 * - Safe to call even if not authenticated
 */

export default defineEventHandler(async (event) => {
  try {
    // Get tokens from cookies
    const accessToken = getCookie(event, 'ju_access_token');

    // Attempt to sign out from Supabase if token exists
    if (accessToken) {
      const supabase = getSupabaseServer();

      // Set session before signing out
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: getCookie(event, 'ju_refresh_token') || '',
      });

      await supabase.auth.signOut();
    }

    // Clear all auth cookies
    clearAuthCookies(event);

    return {
      success: true,
      message: 'Logged out successfully',
    };
  } catch (error) {
    console.error('Logout error:', error);

    // Clear cookies even on error
    clearAuthCookies(event);

    return {
      success: true,
      message: 'Logged out',
    };
  }
});
