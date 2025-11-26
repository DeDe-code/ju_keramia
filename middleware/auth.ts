/**
 * Auth Middleware - Protected Routes
 *
 * Protects admin routes by checking authentication status.
 * Redirects unauthenticated users to the login page.
 *
 * Usage:
 * Add to page meta: definePageMeta({ middleware: 'auth' })
 */

import { useAuthStore } from '~/app/stores/auth';

export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore();

  // Check if user is authenticated
  if (!authStore.isLoggedIn) {
    // Redirect to login page
    return navigateTo('/admin');
  }
});
