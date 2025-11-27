/**
 * Auth Store - Secure Admin Authentication
 *
 * Features:
 * - Server-set HttpOnly cookies for token storage (secure, XSS-protected)
 * - SSR-compatible authentication state
 * - Minimal localStorage persistence (non-sensitive data only)
 *
 * Security:
 * - Tokens stored in HttpOnly Secure cookies (server-managed)
 * - Only non-sensitive user data in Pinia state
 * - SSR guards prevent client-only code from running on server
 *
 * Note: Auto-logout logic is handled by client plugin (plugins/auth-auto-logout.client.ts)
 */

import { defineStore } from 'pinia';
import type { User } from '@supabase/supabase-js';
import {
  type AuthState,
  sanitizeUser,
  isClient,
  safeLocalStorage,
  AUTO_LOGOUT_CONFIG,
} from './index';

interface LoginCredentials {
  email: string;
  password: string;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false,
    lastActivity: Date.now(),
    isTabVisible: true,
    isLoading: false,
  }),

  getters: {
    /**
     * Get current user (sanitized)
     */
    currentUser: (state): User | null => state.user,

    /**
     * Check if user is authenticated
     */
    isLoggedIn: (state): boolean => state.isAuthenticated && state.user !== null,

    /**
     * Get user email
     */
    userEmail: (state): string | undefined => state.user?.email,

    /**
     * Calculate time since last activity (milliseconds)
     */
    timeSinceActivity: (state): number => Date.now() - state.lastActivity,

    /**
     * Check if session is about to expire (within 1 minute of timeout)
     */
    isSessionExpiring: (state): boolean => {
      const timeSince = Date.now() - state.lastActivity;
      const threshold = AUTO_LOGOUT_CONFIG.INACTIVITY_TIMEOUT - 60 * 1000;
      return timeSince > threshold;
    },
  },

  actions: {
    /**
     * Initialize auth state from server (SSR hydration)
     * Called by server plugin that reads HttpOnly cookies
     */
    hydrateFromServer(user: User | null, isAuthenticated: boolean) {
      this.user = sanitizeUser(user);
      this.isAuthenticated = isAuthenticated;
      this.lastActivity = Date.now();
    },

    /**
     * Sign in user
     * Note: This calls the server API which sets HttpOnly cookies
     */
    async signIn(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
      this.isLoading = true;

      try {
        // Call server endpoint that handles Supabase auth and sets cookies
        const response = await $fetch('/api/auth/login', {
          method: 'POST',
          body: credentials,
          credentials: 'include', // Send/receive cookies
        });

        if (response.user) {
          this.user = sanitizeUser(response.user);
          this.isAuthenticated = true;
          this.lastActivity = Date.now();

          return { success: true };
        }

        return { success: false, error: 'Login failed' };
      } catch (error) {
        const err = error as { data?: { message?: string }; message?: string };
        return {
          success: false,
          error: err.data?.message || err.message || 'Authentication failed',
        };
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Sign out user
     * Calls server endpoint to clear HttpOnly cookies
     */
    async signOut(): Promise<void> {
      this.isLoading = true;

      try {
        // Call server endpoint to clear cookies and invalidate session
        await $fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Clear state regardless of API success
        this.user = null;
        this.isAuthenticated = false;
        this.lastActivity = Date.now();
        this.isLoading = false;

        // Broadcast logout to other tabs
        if (isClient()) {
          safeLocalStorage.setItem(AUTO_LOGOUT_CONFIG.LOGOUT_EVENT_KEY, Date.now().toString());
        }
      }
    },

    /**
     * Reset password (send reset email)
     */
    async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
      this.isLoading = true;

      try {
        await $fetch('/api/auth/reset-password', {
          method: 'POST',
          body: { email },
          credentials: 'include',
        });

        return { success: true };
      } catch (error) {
        const err = error as { data?: { message?: string }; message?: string };
        return {
          success: false,
          error: err.data?.message || 'Failed to send reset email',
        };
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Update last activity timestamp
     */
    resetActivity() {
      this.lastActivity = Date.now();
    },

    /**
     * Update tab visibility state
     */
    setTabVisibility(isVisible: boolean) {
      this.isTabVisible = isVisible;
    },
  },

  /**
   * Persistence configuration
   * Persist auth state for navigation between admin pages
   * Tokens remain in HttpOnly cookies (server-managed)
   * This prevents API calls on every route change while maintaining security
   */
  persist: {
    pick: ['user', 'isAuthenticated', 'lastActivity'],
  },
});
