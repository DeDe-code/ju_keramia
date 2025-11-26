/**
 * Shared Store Types and Utilities
 *
 * Provides common types, interfaces, and helper functions used across Pinia stores
 * for the Ju Keramia ceramic e-commerce platform.
 */

import type { User } from '@supabase/supabase-js';

/**
 * Auth State Interface
 * Represents the authentication state for admin users
 */
export interface AuthState {
  /** Current authenticated user (non-sensitive data only) */
  user: User | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Last activity timestamp (for auto-logout) */
  lastActivity: number;
  /** Whether current tab is visible */
  isTabVisible: boolean;
  /** Pending auth operation (loading state) */
  isLoading: boolean;
}

/**
 * UI Preferences State Interface
 * Non-sensitive user preferences safe for localStorage persistence
 */
export interface UiPreferencesState {
  /** Selected theme (future use) */
  theme: 'light' | 'dark' | 'ceramic';
  /** Last visited admin page */
  lastAdminPage: string | null;
  /** Admin dashboard sidebar collapsed state */
  sidebarCollapsed: boolean;
  /** Product list view mode */
  productViewMode: 'grid' | 'list';
}

/**
 * Cookie Storage Configuration
 * For sensitive auth tokens (HttpOnly, Secure)
 */
export const AUTH_COOKIE_CONFIG = {
  /** Access token cookie name */
  ACCESS_TOKEN: 'ju_access_token',
  /** Refresh token cookie name */
  REFRESH_TOKEN: 'ju_refresh_token',
  /** Session ID cookie name */
  SESSION_ID: 'ju_session_id',
  /** Cookie max age (7 days) */
  MAX_AGE: 7 * 24 * 60 * 60,
  /** Cookie path */
  PATH: '/',
  /** SameSite policy */
  SAME_SITE: 'lax' as const,
} as const;

/**
 * Auto-Logout Configuration
 */
export const AUTO_LOGOUT_CONFIG = {
  /** Inactivity timeout (5 minutes) */
  INACTIVITY_TIMEOUT: 5 * 60 * 1000,
  /** Cross-tab logout event key */
  LOGOUT_EVENT_KEY: 'admin_auto_logout',
  /** Activity events to track */
  ACTIVITY_EVENTS: ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'],
} as const;

/**
 * Persistence Configuration
 * Defines what data can be persisted to localStorage (non-sensitive only)
 */
export const PERSISTENCE_CONFIG = {
  /** UI preferences - safe for localStorage */
  uiPreferences: {
    storage: 'localStorage' as const,
    paths: ['theme', 'lastAdminPage', 'sidebarCollapsed', 'productViewMode'],
  },
  /** Auth store - DO NOT persist tokens, only non-sensitive flags */
  auth: {
    storage: 'localStorage' as const,
    paths: ['lastActivity'], // Only persist activity timestamp, NOT tokens
  },
} as const;

/**
 * Type guard to check if code is running on client
 */
export const isClient = (): boolean => {
  return typeof window !== 'undefined' && import.meta.client;
};

/**
 * Type guard to check if code is running on server
 */
export const isServer = (): boolean => {
  return !isClient();
};

/**
 * Safely access localStorage with SSR guards
 */
export const safeLocalStorage = {
  getItem(key: string): string | null {
    if (!isClient()) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    if (!isClient()) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Fail silently
    }
  },
  removeItem(key: string): void {
    if (!isClient()) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Fail silently
    }
  },
};

/**
 * Utility to sanitize user object (remove sensitive fields)
 */
export const sanitizeUser = (user: User | null): User | null => {
  if (!user) return null;

  // Return only safe, non-sensitive user fields
  const { id, email, user_metadata, created_at, updated_at } = user;

  return {
    id,
    email,
    user_metadata,
    created_at,
    updated_at,
  } as User;
};
