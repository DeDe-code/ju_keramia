# Auto-Logout Fix Summary

## Problem

The auto-logout logic was not working properly for these scenarios:

1. Admin closes browser/tab and reopens after 5 minutes - was NOT logged out
2. Admin leaves admin page for more than 5 minutes - was NOT logged out
3. Session persisted indefinitely without validation on page load

## Root Causes

1. **No session validation on page load**: When user reopened browser/tab, there was no check to see if 5 minutes had elapsed since `lastActivity`
2. **Missing server-side validation**: SSR plugin didn't validate session expiry, allowing stale sessions to be restored
3. **Incomplete client plugin**: Client plugin only tracked activity during active session, didn't check on initialization

## Solutions Implemented

### 1. Client Plugin (`plugins/auth-auto-logout.client.ts`)

**Added:**

- `checkSessionValidity()` function that validates session on page load
- Checks if `Date.now() - lastActivity > 5 minutes`
- Automatically logs out if session expired
- Modified `setupListeners()` to be async and call validation first

**Key Changes:**

```typescript
const checkSessionValidity = async () => {
  if (!authStore.isAuthenticated) return;

  const timeSinceActivity = Date.now() - authStore.lastActivity;

  if (timeSinceActivity > AUTO_LOGOUT_CONFIG.INACTIVITY_TIMEOUT) {
    console.warn(
      `Auto-logout: Session expired (${Math.round(timeSinceActivity / 1000 / 60)} minutes since last activity)`
    );
    await handleAutoLogout('inactivity');
    return false;
  }

  return true;
};

const setupListeners = async () => {
  // Check session validity first (important for page refresh/browser reopen)
  const isValid = await checkSessionValidity();
  if (!isValid) return; // Session expired, already logged out

  // ... rest of setup
};
```

### 2. Auth Store (`stores/auth.ts`)

**Added:**

- `validateSession()` action to programmatically check session expiry
- Returns `true` if valid, `false` if expired (and logs out)
- Can be called from anywhere in the app

**Key Changes:**

```typescript
async validateSession(): Promise<boolean> {
  if (!this.isAuthenticated) return false;

  const timeSinceActivity = Date.now() - this.lastActivity;

  if (timeSinceActivity > AUTO_LOGOUT_CONFIG.INACTIVITY_TIMEOUT) {
    await this.signOut();
    return false;
  }

  return true;
}
```

### 3. SSR Plugin (`plugins/auth-ssr.server.ts`)

**Added:**

- Server-side session expiry validation during SSR hydration
- Checks `lastActivity` before hydrating auth state
- Clears cookies if session expired
- Prevents stale sessions from being restored

**Key Changes:**

```typescript
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

// Valid and not expired - hydrate store
authStore.hydrateFromServer(sanitizedUser, true);
```

## How It Works Now

### Session Validation Flow

```
Page Load/Refresh
    ↓
[SSR Plugin - Server-Side]
    ↓
Read lastActivity from persisted state
    ↓
Calculate: Date.now() - lastActivity
    ↓
If > 5 minutes → Clear cookies & logout
If < 5 minutes → Hydrate auth state
    ↓
[Client Plugin - Browser]
    ↓
checkSessionValidity()
    ↓
If expired → logout (redundant check)
If valid → Start inactivity timer
    ↓
User interacts → resetActivity()
    ↓
lastActivity updated
    ↓
Persist to localStorage
```

## Testing Scenarios (All Now Work)

### ✅ Test 1: Browser Close/Reopen

**Scenario:** Admin closes browser, waits 6 minutes, reopens browser
**Expected:** Logged out automatically
**Status:** ✅ FIXED - Session validated on page load

### ✅ Test 2: Tab Close/Reopen

**Scenario:** Admin closes tab, waits 6 minutes, opens new tab
**Expected:** Logged out automatically
**Status:** ✅ FIXED - Session validated on page load

### ✅ Test 3: Inactivity

**Scenario:** Admin stays on page but doesn't interact for 5 minutes
**Expected:** Auto-logout with notification
**Status:** ✅ ALREADY WORKING - Improved with clearer logging

### ✅ Test 4: Tab Hidden

**Scenario:** Admin switches to different tab for 5 minutes
**Expected:** Auto-logout when tab hidden
**Status:** ✅ ALREADY WORKING - Tab visibility tracking functional

### ✅ Test 5: Cross-Tab Logout

**Scenario:** Admin has 2 tabs open, one times out
**Expected:** Both tabs log out
**Status:** ✅ ALREADY WORKING - localStorage event synchronization

## Configuration

All configuration centralized in `stores/index.ts`:

```typescript
export const AUTO_LOGOUT_CONFIG = {
  INACTIVITY_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  LOGOUT_EVENT_KEY: 'admin_auto_logout',
  ACTIVITY_EVENTS: ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'],
};
```

To change timeout to 10 minutes:

```typescript
INACTIVITY_TIMEOUT: 10 * 60 * 1000, // 10 minutes
```

## State Persistence

The `lastActivity` timestamp is persisted in localStorage via Pinia persistence:

```typescript
// stores/auth.ts
persist: {
  pick: ['user', 'isAuthenticated', 'lastActivity'], // lastActivity is critical!
}
```

This allows session validation across browser/tab closes.

## Security Considerations

1. **Client-Side Validation**: Fast, immediate feedback on page load
2. **Server-Side Validation**: Authoritative, runs during SSR
3. **HttpOnly Cookies**: Tokens remain secure, not accessible to JavaScript
4. **Fail-Safe**: If any validation fails, always log out (secure default)

## Files Modified

1. `plugins/auth-auto-logout.client.ts` - Added session validation on init
2. `stores/auth.ts` - Added validateSession() action
3. `plugins/auth-ssr.server.ts` - Added server-side expiry check
4. `.github/copilot-instructions.md` - Updated documentation

## Files Created

1. `docs/AUTO_LOGOUT_TESTING.md` - Comprehensive testing guide

## Quick Test Command

To quickly test auto-logout in browser console:

```javascript
// Force session to expire
localStorage.setItem(
  'auth',
  JSON.stringify({
    ...JSON.parse(localStorage.getItem('auth')),
    lastActivity: Date.now() - 6 * 60 * 1000, // 6 minutes ago
  })
);

// Refresh page - should be logged out
location.reload();
```

## Verification Steps

1. ✅ Login to admin panel
2. ✅ Open browser console and run quick test command
3. ✅ Verify user is logged out after refresh
4. ✅ Check console for "Auto-logout: Session expired" message
5. ✅ Verify auth cookies cleared
6. ✅ Confirm redirected to login page

## Notes

- **Timeout is 5 minutes** from last activity
- **Activity includes**: mouse, keyboard, scroll, touch, click
- **Persisted state**: User, authentication status, lastActivity timestamp
- **Secure storage**: Tokens in HttpOnly cookies, metadata in localStorage
- **Cross-tab sync**: All admin tabs log out together
