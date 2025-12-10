/**
 * Auth Auto-Logout Client Plugin
 *
 * Implements automatic logout for admin users based on:
 * 1. Inactivity timeout (5 minutes of no user interaction)
 * 2. Tab visibility (5 minutes after leaving the tab)
 * 3. Tab/window close (broadcasts logout to other tabs)
 * 4. Page load/refresh (validates session hasn't expired)
 *
 * Security features:
 * - Tracks mouse, keyboard, scroll, and touch events
 * - Monitors tab visibility changes
 * - Validates session on page load
 * - Cleans up on logout to prevent memory leaks
 * - Cross-tab logout synchronization via localStorage
 *
 * CLIENT-ONLY: Runs only in browser environment
 */

import { defineNuxtPlugin } from 'nuxt/app';
import { useAuthStore } from '../../stores/auth';
import { AUTO_LOGOUT_CONFIG, safeLocalStorage } from '../../stores/index';

console.log('[AUTO-LOGOUT PLUGIN] Loading...');

export default defineNuxtPlugin((nuxtApp) => {
  console.log('[AUTO-LOGOUT PLUGIN] Executing...');

  // Only run on client
  if (!import.meta.client) {
    console.log('[AUTO-LOGOUT PLUGIN] Not client, skipping');
    return;
  }

  console.log('[AUTO-LOGOUT PLUGIN] Client detected, initializing...');

  const authStore = useAuthStore() as ReturnType<typeof useAuthStore>;
  console.log(
    '[AUTO-LOGOUT PLUGIN] Auth store loaded, isAuthenticated:',
    authStore.isAuthenticated
  );

  let inactivityTimer: NodeJS.Timeout | null = null;
  let visibilityTimer: NodeJS.Timeout | null = null;

  /**
   * Check if session has expired on page load/refresh
   * Logs out if more than 5 minutes have passed since lastActivity
   */
  const checkSessionValidity = async () => {
    if (!authStore.isAuthenticated) return;

    const timeSinceActivity = Date.now() - authStore.lastActivity;

    // If more than 5 minutes have passed since last activity, logout
    if (timeSinceActivity > AUTO_LOGOUT_CONFIG.INACTIVITY_TIMEOUT) {
      console.warn(
        `Auto-logout: Session expired (${Math.round(timeSinceActivity / 1000 / 60)} minutes since last activity)`
      );
      await handleAutoLogout('inactivity');
      return false;
    }

    return true;
  };

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
   * Handle tab/window visibility change
   * Detects both tab switches and window focus changes
   */
  const handleVisibilityChange = () => {
    if (!authStore.isAuthenticated) return;

    const isVisible = !document.hidden && document.hasFocus();
    authStore.setTabVisibility(isVisible);

    if (!isVisible) {
      // Tab/window is hidden or lost focus - start visibility timer
      clearTimers();
      visibilityTimer = setTimeout(() => {
        handleAutoLogout('tab_hidden');
      }, AUTO_LOGOUT_CONFIG.INACTIVITY_TIMEOUT);
    } else {
      // Tab/window is visible and focused again - restart inactivity timer
      resetInactivityTimer();
    }
  };

  /**
   * Handle window focus change (switching between browser windows)
   */
  const handleWindowFocus = () => {
    if (!authStore.isAuthenticated) return;

    // Window gained focus - check session validity first
    const timeSinceActivity = Date.now() - authStore.lastActivity;

    if (timeSinceActivity > AUTO_LOGOUT_CONFIG.INACTIVITY_TIMEOUT) {
      // Session expired while window was unfocused
      handleAutoLogout('inactivity');
      return;
    }

    // Session still valid - restart inactivity timer
    authStore.setTabVisibility(true);
    resetInactivityTimer();
  };

  /**
   * Handle window blur (losing focus to another window)
   */
  const handleWindowBlur = () => {
    if (!authStore.isAuthenticated) return;

    // Window lost focus - start visibility timer
    authStore.setTabVisibility(false);
    clearTimers();
    visibilityTimer = setTimeout(() => {
      handleAutoLogout('tab_hidden');
    }, AUTO_LOGOUT_CONFIG.INACTIVITY_TIMEOUT);
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
  const handleStorageChange = (e: StorageEvent): void => {
    if (e.key === AUTO_LOGOUT_CONFIG.LOGOUT_EVENT_KEY) {
      // Another tab triggered logout
      clearTimers();
      authStore.signOut();
    }
  };

  /**
   * Setup event listeners
   */
  const setupListeners = async () => {
    console.log('[AUTO-LOGOUT PLUGIN] setupListeners called');

    // Check session validity first (important for page refresh/browser reopen)
    const isValid = await checkSessionValidity();
    console.log('[AUTO-LOGOUT PLUGIN] Session validity check result:', isValid);

    if (!isValid) {
      console.log('[AUTO-LOGOUT PLUGIN] Session expired, exiting setup');
      return; // Session expired, already logged out
    }

    console.log('[AUTO-LOGOUT PLUGIN] Setting up event listeners...');

    // Activity events
    AUTO_LOGOUT_CONFIG.ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer, true);
    });
    console.log('[AUTO-LOGOUT PLUGIN] Activity events added');

    // Visibility change (tab switching)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    console.log('[AUTO-LOGOUT PLUGIN] Visibility change listener added');

    // Window focus/blur (switching between browser windows)
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    console.log('[AUTO-LOGOUT PLUGIN] Focus/blur listeners added');

    // Tab/window close
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cross-tab logout synchronization
    window.addEventListener('storage', handleStorageChange);

    // Start initial timer if authenticated
    if (authStore.isAuthenticated) {
      console.log('[AUTO-LOGOUT PLUGIN] Starting initial inactivity timer');
      resetInactivityTimer();
    } else {
      console.log('[AUTO-LOGOUT PLUGIN] Not authenticated, skipping timer');
    }

    console.log('[AUTO-LOGOUT PLUGIN] Setup complete!');
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
    window.removeEventListener('focus', handleWindowFocus);
    window.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('storage', handleStorageChange);
  };

  // Setup listeners on plugin initialization
  console.log('[AUTO-LOGOUT PLUGIN] Calling setupListeners...');
  setupListeners();

  // Check session validity on every route change (catches navigation back to site)
  nuxtApp.hook('page:finish', async () => {
    console.log('[AUTO-LOGOUT PLUGIN] page:finish hook triggered');
    if (authStore.isAuthenticated) {
      const isValid = await checkSessionValidity();
      if (isValid) {
        // Session is still valid, reset the inactivity timer
        resetInactivityTimer();
      }
    }
  });

  // Cleanup on app unmount (rare, but good practice)
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup);
  }

  console.log('[AUTO-LOGOUT PLUGIN] Plugin initialization complete');

  return {
    provide: {
      authAutoLogout: {
        reset: resetInactivityTimer,
        cleanup,
      },
    },
  };
});
