/**
 * Guest Middleware - Login/Public Routes
 *
 * Redirects authenticated users away from login/public pages
 * to the admin dashboard.
 *
 * Usage:
 * Add to login page meta: definePageMeta({ middleware: 'guest' })
 */

import { useAuthStore } from '~/app/stores/auth';

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();

  // If user is already authenticated, redirect to dashboard
  if (authStore.isLoggedIn && to.path === '/admin') {
    // Stay on current page (already on admin dashboard)
    return;
  }
});
