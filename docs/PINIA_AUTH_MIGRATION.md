# Pinia Auth Store Implementation - Migration Guide

## Overview

Successfully migrated admin authentication from composables (`useAdminAuth`, `useAdminAutoLogout`) to a secure Pinia store architecture with HttpOnly cookie-based authentication and SSR support.

## What Was Implemented

### 1. Core Store Infrastructure

#### `/app/stores/index.ts`

- Shared types and utilities for all Pinia stores
- `AuthState` interface defining auth state structure
- Security constants (`AUTH_COOKIE_CONFIG`, `AUTO_LOGOUT_CONFIG`)
- SSR-safe helpers (`isClient()`, `isServer()`, `safeLocalStorage`)
- User sanitization utilities

#### `/app/stores/auth.ts`

- Main authentication store using Pinia
- State: `user`, `isAuthenticated`, `lastActivity`, `isTabVisible`, `isLoading`
- Actions: `signIn()`, `signOut()`, `resetPassword()`, `hydrateFromServer()`
- Getters: `currentUser`, `isLoggedIn`, `userEmail`, `timeSinceActivity`, `isSessionExpiring`
- **Security:** Only non-sensitive data stored; tokens are in HttpOnly cookies

### 2. Server-Side Implementation

#### `/server/utils/auth.ts`

- `getSupabaseServer()`: Creates isolated Supabase client per request
- `AUTH_COOKIE_OPTIONS`: Centralized cookie configuration
- `clearAuthCookies()`: Utility to clear all auth cookies

#### `/server/utils/auth-helpers.ts`

- `sanitizeUser()`: Removes sensitive fields from User object before returning to client

#### Server API Endpoints

**`/server/api/auth/login.post.ts`**

- Authenticates user with Supabase
- Sets HttpOnly cookies (`ju_access_token`, `ju_refresh_token`)
- Returns sanitized user data (no tokens in response body)
- Cookie config: `httpOnly`, `secure` (production), `sameSite: 'lax'`, 7-day expiry

**`/server/api/auth/logout.post.ts`**

- Invalidates Supabase session
- Clears all auth cookies
- Safe to call even if not authenticated

**`/server/api/auth/reset-password.post.ts`**

- Sends password reset email via Supabase
- Validates email and site URL
- Returns success/error status

**`/server/api/auth/me.get.ts`**

- Returns current user by validating HttpOnly cookie
- Automatically refreshes tokens if needed
- Updates cookies with new tokens

### 3. Client-Side Plugins

#### `/plugins/auth-ssr.server.ts`

- **SERVER-ONLY plugin** for SSR hydration
- Reads HttpOnly cookies during server-side rendering
- Validates session with Supabase
- Hydrates Pinia auth store with sanitized user data
- Ensures server-rendered pages have auth context

#### `/plugins/auth-auto-logout.client.ts`

- **CLIENT-ONLY plugin** for auto-logout functionality
- Tracks user activity (mouse, keyboard, scroll, touch)
- Monitors tab visibility changes
- Auto-logout after 5 minutes of inactivity
- Auto-logout after 5 minutes with tab hidden
- Cross-tab logout synchronization via localStorage
- Cleans up timers and event listeners properly

### 4. Configuration

#### `/nuxt.config.ts`

- Added `pinia-plugin-persistedstate/nuxt` to modules array
- Enables persistent localStorage for non-sensitive data

#### `/plugins/pinia-persistedstate.ts`

- (Existing plugin - kept for manual Pinia setup if needed)

## Security Features

### 1. HttpOnly Cookies

- **Access tokens** and **refresh tokens** stored in HttpOnly cookies
- Cannot be accessed by client-side JavaScript (XSS protection)
- `Secure` flag in production (HTTPS only)
- `SameSite=lax` for CSRF protection
- 7-day expiration with automatic refresh

### 2. No Tokens in localStorage

- **pinia-plugin-persistedstate** configured to persist ONLY `lastActivity` timestamp
- User object is NOT persisted (re-fetched on page load)
- Tokens are NEVER stored in localStorage or Pinia state

### 3. SSR-Safe Implementation

- Server plugin validates cookies during SSR
- Client plugin uses `import.meta.client` guards
- `safeLocalStorage` utility prevents SSR errors

### 4. CSRF Protection

- `SameSite=lax` cookies prevent cross-site request forgery
- Credentials must be explicitly included (`credentials: 'include'`)
- Same-origin policy enforced

### 5. Auto-Logout Security

- 5-minute inactivity timeout
- 5-minute hidden tab timeout
- Cross-tab logout synchronization
- Prevents abandoned sessions

## Migration from Composables

### Before (Composables)

```typescript
// composables/useAdminAuth.ts
export const useAdminAuth = () => {
  const supabase = useSupabase();
  const user = ref<User | null>(null);
  // ... localStorage-based auth
};

// composables/useAdminAutoLogout.ts
export const useAdminAutoLogout = () => {
  // ... manual timer management
};
```

### After (Pinia Store)

```typescript
// app/stores/auth.ts
export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null, isAuthenticated: false, ... }),
  actions: {
    async signIn(credentials) { /* server API call */ },
    async signOut() { /* server API call */ },
  },
});

// Usage in components
const authStore = useAuthStore();
await authStore.signIn({ email, password });
```

## Usage Examples

### 1. Sign In (Component)

```vue
<script setup lang="ts">
import { useAuthStore } from '~/app/stores/auth';

const authStore = useAuthStore();
const email = ref('');
const password = ref('');
const error = ref('');

const handleSignIn = async () => {
  const result = await authStore.signIn({ email: email.value, password: password.value });

  if (result.success) {
    navigateTo('/admin');
  } else {
    error.value = result.error || 'Login failed';
  }
};
</script>

<template>
  <form @submit.prevent="handleSignIn">
    <input v-model="email" type="email" required />
    <input v-model="password" type="password" required />
    <button type="submit" :disabled="authStore.isLoading">Sign In</button>
    <p v-if="error">{{ error }}</p>
  </form>
</template>
```

### 2. Protected Page (Middleware)

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();

  if (!authStore.isLoggedIn) {
    return navigateTo('/admin/login');
  }
});
```

### 3. Check Auth State

```vue
<script setup lang="ts">
const authStore = useAuthStore();
</script>

<template>
  <div v-if="authStore.isLoggedIn">
    <p>Welcome, {{ authStore.userEmail }}</p>
    <button @click="authStore.signOut">Sign Out</button>
  </div>
  <div v-else>
    <NuxtLink to="/admin/login">Sign In</NuxtLink>
  </div>
</template>
```

### 4. Password Reset

```vue
<script setup lang="ts">
const authStore = useAuthStore();
const email = ref('');
const message = ref('');

const handleReset = async () => {
  const result = await authStore.resetPassword(email.value);
  message.value = result.success ? 'Reset email sent!' : result.error || 'Failed to send';
};
</script>
```

## Environment Variables Required

```bash
# .env
NUXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NUXT_PUBLIC_SITE_URL=http://localhost:3000 # or production URL
```

## Testing Checklist

- [ ] Sign in with valid credentials → cookies set, user authenticated
- [ ] Sign out → cookies cleared, user logged out
- [ ] Refresh page while authenticated → SSR hydrates auth state
- [ ] Password reset email → Supabase sends reset email
- [ ] Auto-logout after 5 min inactivity → user logged out
- [ ] Auto-logout after hiding tab for 5 min → user logged out
- [ ] Sign out in one tab → all tabs log out (cross-tab sync)
- [ ] Inspect cookies → `ju_access_token` and `ju_refresh_token` are HttpOnly
- [ ] Check localStorage → NO tokens stored (only `lastActivity`)

## Known Limitations & TODOs

1. **Rate Limiting**: Password reset endpoint should implement rate limiting to prevent abuse
2. **CAPTCHA**: Consider adding CAPTCHA to login form for brute-force protection
3. **Token Rotation**: Implement refresh token rotation for enhanced security
4. **Session Management UI**: Add UI to show session expiration warnings
5. **Audit Logging**: Log authentication events for security monitoring

## Breaking Changes from Composables

- `useAdminAuth()` → `useAuthStore()`
- `useAdminAutoLogout()` → automatic via client plugin (no manual setup needed)
- `form.value` → pass credentials directly to `signIn({ email, password })`
- `error.value` → check return value: `result.error`
- `user.value` → `authStore.user` or `authStore.currentUser`

## Files to Update in Your App

1. **Login Page** (`app/pages/admin/index.vue` or similar):
   - Replace `useAdminAuth()` with `useAuthStore()`
   - Update sign-in logic to use `authStore.signIn(credentials)`

2. **Admin Layout** (`app/layouts/admin.vue`):
   - Replace composable usage with `useAuthStore()`
   - Remove manual `useAdminAutoLogout()` calls (now automatic)

3. **Middleware** (create `middleware/auth.ts`):
   - Add route protection using `authStore.isLoggedIn`

4. **Navigation Components**:
   - Update to use `authStore.userEmail` and `authStore.signOut()`

## Performance Considerations

- **SSR Overhead**: Server plugin validates cookies on every SSR request (acceptable for auth)
- **Client Hydration**: Minimal - only non-sensitive `lastActivity` persisted
- **Event Listeners**: Auto-logout plugin adds 6 event listeners (cleanup on unmount)
- **Cross-Tab Sync**: Uses localStorage events (negligible performance impact)

## Security Audit Recommendations

1. **Regularly rotate Supabase keys**: Update anon key periodically
2. **Monitor failed login attempts**: Implement logging and alerting
3. **Review cookie settings**: Ensure `Secure` flag is enabled in production
4. **Test XSS protection**: Verify tokens cannot be accessed via JavaScript
5. **Audit auto-logout timing**: Adjust 5-minute timeout based on security requirements

---

**Implementation Date**: November 25, 2025  
**Status**: ✅ Complete  
**Next Steps**: Update existing components to use new auth store
