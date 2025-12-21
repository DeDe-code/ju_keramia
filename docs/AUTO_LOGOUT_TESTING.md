# Auto-Logout Testing Guide

## Overview

The auto-logout system now properly handles all logout scenarios:

1. **Browser/Tab Close**: Session validated on page load
2. **Inactivity**: 5 minutes of no user interaction
3. **Tab Hidden**: 5 minutes after leaving the admin page
4. **Cross-Tab**: Logout in one tab affects all tabs

## Changes Made

### 1. Client Plugin (`plugins/auth-auto-logout.client.ts`)

- Added `checkSessionValidity()` function to validate session on page load
- Checks if more than 5 minutes have passed since `lastActivity`
- Automatically logs out if session expired
- Modified `setupListeners()` to be async and call validation first

### 2. Auth Store (`stores/auth.ts`)

- Added `validateSession()` action to check session expiry
- Returns `false` if session expired, `true` if valid
- Persists `lastActivity` timestamp in localStorage

### 3. SSR Plugin (`plugins/auth-ssr.server.ts`)

- Added server-side session expiry check
- Validates `lastActivity` during SSR hydration
- Clears cookies and logs out if session expired
- Prevents stale sessions from being restored

## Testing Scenarios

### Test 1: Browser Close/Reopen

**Expected:** If more than 5 minutes passed, user is logged out

1. Login to admin panel at `/admin`
2. Wait 6 minutes (or manually set `lastActivity` to old timestamp)
3. Close browser completely
4. Reopen browser and navigate to `/admin/products`
5. **Expected Result:** User is logged out, redirected to login

**Manual Testing (Fast):**

```javascript
// In browser console while logged in:
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

### Test 2: Tab Close/Reopen

**Expected:** Same as browser close

1. Login to admin panel
2. Wait 6 minutes
3. Close tab
4. Open new tab to `/admin/products`
5. **Expected Result:** User is logged out

### Test 3: Inactivity Timeout

**Expected:** Logout after 5 minutes of no interaction

1. Login to admin panel
2. Don't move mouse, type, or interact with page
3. Wait 5 minutes
4. **Expected Result:** Automatic logout with message

### Test 4: Tab Hidden (Switch Tab)

**Expected:** Logout after 5 minutes of tab being hidden

1. Login to admin panel
2. Switch to different tab (hide admin tab)
3. Wait 5 minutes
4. Switch back to admin tab
5. **Expected Result:** Automatic logout

### Test 5: Cross-Tab Logout

**Expected:** Logout in one tab logs out all tabs

1. Open admin panel in Tab A
2. Open admin panel in Tab B
3. In Tab A, wait 5 minutes (or force logout)
4. **Expected Result:** Tab B also logs out automatically

### Test 6: Activity Reset

**Expected:** User activity resets the timer

1. Login to admin panel
2. Wait 4 minutes
3. Move mouse or click something
4. Wait another 4 minutes
5. **Expected Result:** Still logged in (timer was reset)

## Configuration

Located in `stores/index.ts`:

```typescript
export const AUTO_LOGOUT_CONFIG = {
  INACTIVITY_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  LOGOUT_EVENT_KEY: 'admin_auto_logout',
  ACTIVITY_EVENTS: ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'],
};
```

To change timeout (e.g., to 10 minutes):

```typescript
INACTIVITY_TIMEOUT: 10 * 60 * 1000, // 10 minutes
```

## Implementation Details

### Session Validation Flow

```
Page Load/Refresh
    ↓
[SSR Plugin]
    ↓
Read lastActivity from localStorage
    ↓
Calculate: Date.now() - lastActivity
    ↓
If > 5 minutes → Clear cookies & logout
If < 5 minutes → Hydrate auth state
    ↓
[Client Plugin]
    ↓
checkSessionValidity()
    ↓
If expired → logout
If valid → Start inactivity timer
```

### Timer Management

- **Inactivity Timer**: Resets on any user activity
- **Visibility Timer**: Starts when tab hidden, cleared when tab visible
- **Both Timers**: Cleared on logout to prevent memory leaks

### Cross-Tab Synchronization

- Uses `localStorage` event listener
- Broadcasts logout via `admin_auto_logout` key
- All tabs receive event and log out simultaneously

## Debugging

### Check Current Session State

```javascript
// In browser console:
const authStore = JSON.parse(localStorage.getItem('auth'));
console.log('Last Activity:', new Date(authStore.lastActivity));
console.log('Time Since Activity (min):', (Date.now() - authStore.lastActivity) / 1000 / 60);
console.log('Is Authenticated:', authStore.isAuthenticated);
```

### Force Logout Test

```javascript
// Force session to expire:
localStorage.setItem(
  'auth',
  JSON.stringify({
    ...JSON.parse(localStorage.getItem('auth')),
    lastActivity: Date.now() - 6 * 60 * 1000,
  })
);
location.reload();
```

### Monitor Auto-Logout Events

```javascript
// Listen for logout events:
window.addEventListener('storage', (e) => {
  if (e.key === 'admin_auto_logout') {
    console.log('Logout event detected from another tab');
  }
});
```

## Security Considerations

1. **Client-Side Validation**: Initial check on page load
2. **Server-Side Validation**: SSR validates session before hydration
3. **HttpOnly Cookies**: Tokens stored securely, not accessible to JS
4. **Fail-Safe**: If validation fails, always log out (secure default)

## Known Limitations

1. **Clock Skew**: If user changes system time, validation may fail
2. **localStorage Limit**: Rare, but if localStorage is full, persistence fails
3. **Multiple Devices**: Each device tracks its own `lastActivity`

## Troubleshooting

### Issue: User not logged out after 5 minutes

**Check:**

1. Are there background timers/intervals keeping page active?
2. Is `lastActivity` being updated correctly?
3. Check browser console for errors

**Fix:**

```javascript
// Check if timers are running:
console.log('Timers:', window.setTimeout.length);
```

### Issue: User logged out too quickly

**Check:**

1. Is `INACTIVITY_TIMEOUT` set correctly?
2. Is `lastActivity` persisting properly?

**Fix:**
Increase timeout in `stores/index.ts`

### Issue: Cross-tab logout not working

**Check:**

1. localStorage available and working?
2. Are tabs in same domain?

**Fix:**

```javascript
// Test localStorage events:
localStorage.setItem('test', Date.now().toString());
```
