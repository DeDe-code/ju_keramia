/**
 * Admin Auto-Logout Composable
 *
 * Implements automatic logout for admin users based on:
 * 1. Inactivity timeout (5 minutes of no user interaction)
 * 2. Tab visibility (5 minutes after leaving the tab)
 * 3. Tab/window close (immediate logout)
 *
 * Security features:
 * - Tracks mouse, keyboard, scroll, and touch events
 * - Monitors tab visibility changes
 * - Cleans up on logout to prevent memory leaks
 * - Cross-tab logout synchronization via localStorage
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { useAdminAuth } from './useAdminAuth';
import { useNotifications } from './useNotifications';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
const LOGOUT_EVENT_KEY = 'admin_auto_logout';

export const useAdminAutoLogout = () => {
  const { signOut } = useAdminAuth();
  const { notifyWarning } = useNotifications();

  let inactivityTimer: NodeJS.Timeout | null = null;
  let visibilityTimer: NodeJS.Timeout | null = null;
  const isTabVisible = ref(true);

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

    // Notify user about logout reason
    const messages = {
      inactivity: 'Logged out due to 5 minutes of inactivity',
      tab_hidden: 'Logged out after 5 minutes away from admin panel',
      tab_closed: 'Logged out automatically',
    };

    notifyWarning('Auto Logout', messages[reason]);

    // Broadcast logout to other tabs
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOGOUT_EVENT_KEY, Date.now().toString());
    }

    // Perform logout
    await signOut();
  };

  /**
   * Reset inactivity timer
   */
  const resetInactivityTimer = () => {
    clearTimers();

    // Only start timer if tab is visible
    if (isTabVisible.value) {
      inactivityTimer = setTimeout(() => {
        handleAutoLogout('inactivity');
      }, INACTIVITY_TIMEOUT);
    }
  };

  /**
   * Handle tab visibility change
   */
  const handleVisibilityChange = () => {
    if (typeof document === 'undefined') return;

    isTabVisible.value = !document.hidden;

    if (document.hidden) {
      // Tab is hidden - start visibility timer
      clearTimers();
      visibilityTimer = setTimeout(() => {
        handleAutoLogout('tab_hidden');
      }, INACTIVITY_TIMEOUT);
    } else {
      // Tab is visible again - restart inactivity timer
      clearTimers();
      resetInactivityTimer();
    }
  };

  /**
   * Handle tab/window close
   */
  const handleBeforeUnload = () => {
    // Trigger immediate logout on tab close
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOGOUT_EVENT_KEY, Date.now().toString());
    }
    signOut();
  };

  /**
   * Listen for logout events from other tabs
   */
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === LOGOUT_EVENT_KEY) {
      // Another tab triggered logout
      clearTimers();
      signOut();
    }
  };

  /**
   * Setup event listeners
   */
  const setupListeners = () => {
    if (typeof window === 'undefined') return;

    // Activity events
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer, true);
    });

    // Visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Tab/window close
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cross-tab logout synchronization
    window.addEventListener('storage', handleStorageChange);

    // Start initial timer
    resetInactivityTimer();
  };

  /**
   * Cleanup event listeners
   */
  const cleanup = () => {
    if (typeof window === 'undefined') return;

    clearTimers();

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    activityEvents.forEach((event) => {
      window.removeEventListener(event, resetInactivityTimer, true);
    });

    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('storage', handleStorageChange);
  };

  // Lifecycle hooks
  onMounted(() => {
    setupListeners();
  });

  onUnmounted(() => {
    cleanup();
  });

  return {
    cleanup,
    resetInactivityTimer,
  };
};
