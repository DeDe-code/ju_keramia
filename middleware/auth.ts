/**
 * Auth Middleware - Protected Routes
 *
 * Protects admin routes by checking authentication status.
 * Redirects unauthenticated users to the login page.
 *
 * Strategy:
 * - Client: Trust persisted auth state if present, verify with server if missing
 * - Server: Use SSR-hydrated state from cookies
 *
 * Usage:
 * Add to page meta: definePageMeta({ middleware: 'auth' })
 */
import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app';
import { useAuthStore } from '../stores/auth';
import type { User } from '@supabase/supabase-js';

export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore();

  // On client-side navigation
  if (import.meta.client) {
    // If auth state is already present (from localStorage persistence), allow navigation
    if (authStore.isLoggedIn) {
      return;
    }

    // Auth state not present - verify with server
    try {
      const response = await $fetch<{ user: User | null; isAuthenticated: boolean }>(
        '/api/auth/me',
        {
          credentials: 'include',
        }
      );

      if (response.isAuthenticated && response.user) {
        // Update store with fresh auth state
        authStore.hydrateFromServer(response.user, true);
        return; // Auth is valid, allow navigation
      } else {
        // User is not authenticated - redirect to login
        authStore.hydrateFromServer(null, false);
        return navigateTo('/admin');
      }
    } catch (error) {
      // API call failed - treat as unauthenticated
      console.error('Auth middleware error:', error);
      authStore.hydrateFromServer(null, false);
      return navigateTo('/admin');
    }
  }

  // On server-side, check store state (hydrated by SSR plugin)
  if (!authStore.isLoggedIn) {
    return navigateTo('/admin');
  }
});
