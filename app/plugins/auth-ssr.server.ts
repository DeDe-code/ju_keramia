/**
 * Auth SSR Plugin - Server-Side Session Hydration
 *
 * Runs on the server during SSR to:
 * 1. Read HttpOnly auth cookies from the request
 * 2. Validate the session with Supabase
 * 3. Check session hasn't expired (5 min inactivity)
 * 4. Hydrate the Pinia auth store with user data
 *
 * This ensures server-rendered pages have access to auth state
 * and can render appropriately for authenticated users.
 *
 * Security:
 * - Only reads HttpOnly cookies (cannot be accessed by client JS)
 * - Validates session server-side before hydrating state
 * - Checks session expiry based on lastActivity
 * - Sanitizes user data before storing in Pinia
 */

import { getCookie, setCookie } from 'h3';
import { defineNuxtPlugin, useRequestEvent } from 'nuxt/app';
import type { NuxtApp } from 'nuxt/app';
import type { Pinia } from 'pinia';
import { useAuthStore } from '../../stores/auth';
import { sanitizeUser } from '../../server/utils/auth-helpers';
import { getSupabaseServer, clearAuthCookies, AUTH_COOKIE_OPTIONS } from '../../server/utils/auth';
import { AUTO_LOGOUT_CONFIG } from '../../stores/index';

/**
 * Hydrate auth store from server-side session
 */
async function hydrateAuthFromCookies(nuxtApp: NuxtApp): Promise<void> {
  const authStore = useAuthStore(nuxtApp.$pinia as Pinia) as ReturnType<typeof useAuthStore>;
  const event = useRequestEvent();

  if (!event) return;

  try {
    // Read auth cookies from request
    const accessToken = getCookie(event, 'ju_access_token');
    const refreshToken = getCookie(event, 'ju_refresh_token');

    // If no tokens, user is not authenticated
    if (!accessToken) {
      authStore.hydrateFromServer(null, false);
      return;
    }

    // Validate session with Supabase using the access token
    const supabaseClient = getSupabaseServer();

    // Set the session from cookies
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    });

    if (sessionError || !sessionData.user) {
      // Invalid session - clear cookies and set unauthenticated state
      clearAuthCookies(event);
      authStore.hydrateFromServer(null, false);
      return;
    }

    // Valid session - check if it has expired based on lastActivity
    const timeSinceActivity = Date.now() - authStore.lastActivity;

    if (timeSinceActivity > AUTO_LOGOUT_CONFIG.INACTIVITY_TIMEOUT) {
      // Session expired - clear cookies and logout
      console.warn(
        `SSR: Session expired (${Math.round(timeSinceActivity / 1000 / 60)} minutes since last activity)`
      );
      clearAuthCookies(event);
      authStore.hydrateFromServer(null, false);
      return;
    }

    // Valid and not expired - hydrate store with sanitized user data
    const sanitizedUser = sanitizeUser(sessionData.user);
    authStore.hydrateFromServer(sanitizedUser, true);

    // Optional: Refresh tokens if needed (handle refresh logic)
    if (sessionData.session) {
      const newAccessToken = sessionData.session.access_token;
      const newRefreshToken = sessionData.session.refresh_token;

      // Update cookies if tokens were refreshed
      if (newAccessToken !== accessToken) {
        setCookie(event, 'ju_access_token', newAccessToken, AUTH_COOKIE_OPTIONS);
      }

      if (newRefreshToken && newRefreshToken !== refreshToken) {
        setCookie(event, 'ju_refresh_token', newRefreshToken, AUTH_COOKIE_OPTIONS);
      }
    }
  } catch (error) {
    console.error('SSR auth hydration error:', error);
    authStore.hydrateFromServer(null, false);
  }
}

// @ts-expect-error - TypeScript has circular reference issues with async plugin initialization
export default defineNuxtPlugin((nuxtApp: NuxtApp) => {
  // Only run on server-side
  if (import.meta.client) return;

  return hydrateAuthFromCookies(nuxtApp);
});
