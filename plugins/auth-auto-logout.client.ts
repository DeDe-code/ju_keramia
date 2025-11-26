/**
 * Auth Auto-Logout Client Plugin
 *
 * Implements automatic logout for admin users based on:
 * 1. Inactivity timeout (5 minutes of no user interaction)
 * 2. Tab visibility (5 minutes after leaving the tab)
 * 3. Tab/window close (broadcasts logout to other tabs)
 *
 * Security features:
 * - Tracks mouse, keyboard, scroll, and touch events
 * - Monitors tab visibility changes
 * - Cleans up on logout to prevent memory leaks
 * - Cross-tab logout synchronization via localStorage
 *
 * CLIENT-ONLY: Runs only in browser environment
 */

import { defineNuxtPlugin } from 'nuxt/app';
import { useAuthStore } from '../stores/auth';
import { AUTO_LOGOUT_CONFIG, safeLocalStorage } from '../stores/index';

export default defineNuxtPlugin(() => {
  // Only run on client
  if (!import.meta.client) return;

  const authStore = useAuthStore();

  let inactivityTimer: NodeJS.Timeout | null = null;
  let visibilityTimer: NodeJS.Timeout | null = null;

  /**
   * Clear all timers
   */
  const clearTimers = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
    if (visibilityTimer) {
      clearTimeout(visibilityTimer);
      visibilityTimer = null;
    }
  };

  /**
   * Handle auto-logout
   */
  const handleAutoLogout = async (reason: 'inactivity' | 'tab_hidden' | 'tab_closed') => {
    clearTimers();

    const messages = {
      inactivity: 'Logged out due to 5 minutes of inactivity',
      tab_hidden: 'Logged out after 5 minutes away from admin panel',
      tab_closed: 'Logged out automatically',
    };

    console.warn(`Auto-logout: ${messages[reason]}`);

    // Broadcast logout to other tabs
    safeLocalStorage.setItem(AUTO_LOGOUT_CONFIG.LOGOUT_EVENT_KEY, Date.now().toString());

    // Perform logout
    await authStore.signOut();
  };

  /**
   * Reset inactivity timer on user activity
   */
  const resetInactivityTimer = () => {
    // Only start timer if user is authenticated and tab is visible
    if (!authStore.isAuthenticated || !authStore.isTabVisible) return;

    clearTimers();
    authStore.resetActivity();

    inactivityTimer = setTimeout(() => {
      handleAutoLogout('inactivity');
    }, AUTO_LOGOUT_CONFIG.INACTIVITY_TIMEOUT);
  };

  /**
   * Handle tab visibility change
   */
  const handleVisibilityChange = () => {
    if (!authStore.isAuthenticated) return;

    const isVisible = !document.hidden;
    authStore.setTabVisibility(isVisible);

    if (document.hidden) {
      // Tab is hidden - start visibility timer
      clearTimers();
      visibilityTimer = setTimeout(() => {
        handleAutoLogout('tab_hidden');
      }, AUTO_LOGOUT_CONFIG.INACTIVITY_TIMEOUT);
    } else {
      // Tab is visible again - restart inactivity timer
      resetInactivityTimer();
    }
  };

  /**
   * Handle tab/window close
   */
  const handleBeforeUnload = () => {
    if (!authStore.isAuthenticated) return;

    // Broadcast logout to other tabs
    safeLocalStorage.setItem(AUTO_LOGOUT_CONFIG.LOGOUT_EVENT_KEY, Date.now().toString());
  };

  /**
   * Listen for logout events from other tabs
   */
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === AUTO_LOGOUT_CONFIG.LOGOUT_EVENT_KEY) {
      // Another tab triggered logout
      clearTimers();
      authStore.signOut();
    }
  };

  /**
   * Setup event listeners
   */
  const setupListeners = () => {
    // Activity events
    AUTO_LOGOUT_CONFIG.ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer, true);
    });

    // Visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Tab/window close
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cross-tab logout synchronization
    window.addEventListener('storage', handleStorageChange);

    // Start initial timer if authenticated
    if (authStore.isAuthenticated) {
      resetInactivityTimer();
    }
  };

  /**
   * Cleanup event listeners
   */
  const cleanup = () => {
    clearTimers();

    AUTO_LOGOUT_CONFIG.ACTIVITY_EVENTS.forEach((event) => {
      window.removeEventListener(event, resetInactivityTimer, true);
    });

    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('storage', handleStorageChange);
  };

  // Setup listeners on plugin initialization
  setupListeners();

  // Cleanup on app unmount (rare, but good practice)
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup);
  }

  return {
    provide: {
      authAutoLogout: {
        reset: resetInactivityTimer,
        cleanup,
      },
    },
  };
});
