# Password Leak Detection Composable

## Overview

The `usePasswordLeakCheck` composable provides **client-side password leak detection** using the [Have I Been Pwned (HIBP) API](https://haveibeenpwned.com/API/v3#PwnedPasswords). This adds an extra security layer on top of the existing Zod password validation.

## How It Works

### k-Anonymity Model

The composable uses HIBP's **k-Anonymity** approach to protect user privacy:

1. **Hash the password** using SHA-1 on the client
2. **Send only the first 5 characters** of the hash to HIBP API
3. **Receive a list** of all hash suffixes matching that prefix
4. **Check locally** if the full hash appears in the list

**Example:**

- Password: `P@ssw0rd`
- SHA-1 Hash: `21BD12DC183F740EE76F27B78EB39C8AD972A757`
- Sent to API: `21BD1` (first 5 chars)
- API returns: ~500 hash suffixes that start with `21BD1`
- Check locally: Is `2DC183F740EE76F27B78EB39C8AD972A757` in the list?

**Privacy:** The full password hash never leaves the client, and HIBP cannot reverse-engineer the password from a 5-character prefix.

## API Reference

### `usePasswordLeakCheck()`

Returns an object with the following methods and reactive state:

#### Methods

##### `checkPassword(password: string): Promise<boolean>`

Check if a password appears in breach databases.

**Parameters:**

- `password` (string): The password to check

**Returns:**

- `Promise<boolean>`:
  - `true` = password is leaked/compromised
  - `false` = password is safe (or API check failed - "fail open")

**Example:**

```typescript
const { checkPassword } = usePasswordLeakCheck();

const isLeaked = await checkPassword('P@ssw0rd123');
if (isLeaked) {
  console.log('Password found in breach database!');
}
```

##### `checkPasswordWithMessage(password: string): Promise<{ isLeaked: boolean; message: string | null }>`

Check password and return a user-friendly message.

**Parameters:**

- `password` (string): The password to check

**Returns:**

- `Promise<object>`:
  - `isLeaked` (boolean): Whether password is compromised
  - `message` (string | null): User-friendly error/warning message

**Example:**

```typescript
const { checkPasswordWithMessage } = usePasswordLeakCheck();

const result = await checkPasswordWithMessage('P@ssw0rd123');
if (result.isLeaked) {
  errorMsg.value = result.message; // "This password has appeared in a known data breach..."
}
```

##### `reset(): void`

Reset state (clears errors and loading flags).

**Example:**

```typescript
const { reset } = usePasswordLeakCheck();

reset(); // Clear any errors
```

#### Reactive State

##### `isChecking: Readonly<Ref<boolean>>`

Indicates whether a password check is currently in progress.

**Usage:**

```typescript
const { isChecking } = usePasswordLeakCheck();

// Disable submit button during check
<UButton :disabled="isChecking">Submit</UButton>
```

##### `error: Readonly<Ref<string | null>>`

Contains error message if API check fails.

**Usage:**

```typescript
const { error } = usePasswordLeakCheck();

// Show error to user
<div v-if="error">{{ error }}</div>
```

## Integration Example

### Password Reset Page

```vue
<script setup lang="ts">
import { usePasswordLeakCheck } from '~~/composables/usePasswordLeakCheck';

const { checkPasswordWithMessage, isChecking } = usePasswordLeakCheck();
const form = ref({ newPassword: '', confirmPassword: '' });
const errorMsg = ref('');

const updatePassword = async () => {
  // Check for leaked password
  const leakCheck = await checkPasswordWithMessage(form.value.newPassword);

  if (leakCheck.isLeaked) {
    errorMsg.value = leakCheck.message;
    return; // Block password change
  }

  // Proceed with password update
  await supabase.auth.updateUser({ password: form.value.newPassword });
};
</script>

<template>
  <UForm @submit="updatePassword">
    <div v-if="errorMsg" class="text-red-600">{{ errorMsg }}</div>

    <UInput v-model="form.newPassword" type="password" />
    <UButton type="submit" :loading="isChecking">
      {{ isChecking ? 'Checking password...' : 'Update Password' }}
    </UButton>
  </UForm>
</template>
```

## Security Features

### 1. **Privacy Protection**

- Uses k-Anonymity (5-character prefix)
- Full password hash never sent to external API
- Adds `Add-Padding` header for additional privacy

### 2. **Fail-Open Strategy**

If the HIBP API is unavailable or fails:

- Returns `false` (password not leaked)
- Logs error to console
- Does **not block** the user from proceeding

**Rationale:** Better to allow a potentially weak password than block legitimate users when the API is down.

### 3. **No False Positives**

- Only flags passwords that **definitely** appear in breach databases
- Hash collision is extremely unlikely (SHA-1 is 160 bits)

## Performance

- **Typical latency:** 100-300ms
- **API endpoint:** `https://api.pwnedpasswords.com/range/{prefix}`
- **Rate limiting:** HIBP API is free and has generous rate limits
- **Caching:** Not implemented (each check is fresh for security)

## Current Implementation

### Integrated Pages

✅ **Password Reset** (`/auth/reset`) - Checks password before Supabase update

### Not Yet Integrated

❌ **Initial Admin Sign-Up** - If you add user registration, integrate there
❌ **Password Change Form** - If you add a separate password change page

## Testing

### Test with Known Breached Password

```bash
# Try these passwords (all are in HIBP database):
- "password"
- "123456"
- "P@ssw0rd"
- "Password123!"
```

### Test with Strong Password

```bash
# Generate a random strong password (should pass):
openssl rand -base64 16
```

### Test API Failure

```bash
# Block HIBP API temporarily to test fail-open behavior:
# Add to /etc/hosts:
127.0.0.1 api.pwnedpasswords.com
```

## Best Practices

### 1. **Don't Remove Zod Validation**

The leak check is **supplementary**, not a replacement:

- Zod enforces complexity (uppercase, numbers, special chars)
- HIBP catches known-breached passwords

Both are needed for maximum security.

### 2. **Show Clear Error Messages**

When a password is rejected:

```typescript
'This password has appeared in a known data breach. Please choose a different password.';
```

Avoid:

```typescript
'Password not allowed'; // Too vague
'Your password sucks'; // Unprofessional
```

### 3. **Loading States**

Always show loading indicator during check:

```vue
<UButton :loading="isChecking">
  {{ isChecking ? 'Checking password...' : 'Submit' }}
</UButton>
```

### 4. **Error Handling**

If API fails, inform user (optional):

```typescript
if (error.value) {
  warningMsg.value = 'Unable to verify password security. Please try again.';
}
```

## Comparison: Pro Plan vs. Free Plan Solution

| **Feature**          | **Supabase Pro (HIBP Native)** | **This Composable (Free)**       |
| -------------------- | ------------------------------ | -------------------------------- |
| **Cost**             | $25/month                      | Free                             |
| **Where Check Runs** | Server-side                    | Client-side                      |
| **Privacy**          | k-Anonymity                    | k-Anonymity                      |
| **Performance**      | Faster (server-to-server)      | Slightly slower (client-to-HIBP) |
| **Coverage**         | All auth flows                 | Manual integration required      |
| **Fail Behavior**    | Configurable                   | Fail open (by design)            |
| **Maintenance**      | Managed by Supabase            | You maintain code                |

## Future Enhancements

### 1. **Add Debouncing**

For real-time password feedback:

```typescript
const debouncedCheck = useDebounceFn(checkPassword, 500);
```

### 2. **Cache Results (Carefully)**

Cache negative results (not leaked) for current session:

```typescript
const checkedPasswords = new Set<string>();
```

**Warning:** Don't cache positive results (leaked passwords) as HIBP database updates daily.

### 3. **Visual Feedback**

Show password strength meter with leak status:

```vue
<div class="strength-meter">
  <div v-if="!isLeaked && isStrong" class="text-green-600">
    ✓ Strong password
  </div>
</div>
```

## Troubleshooting

### Issue: "Failed to check password"

**Cause:** HIBP API is unreachable or blocked

**Solutions:**

1. Check network connectivity
2. Verify firewall/proxy settings
3. Check browser console for CORS errors
4. Confirm `api.pwnedpasswords.com` is accessible

### Issue: Always returns `false`

**Cause:** API integration error or hash mismatch

**Solutions:**

1. Check browser console for errors
2. Verify SHA-1 hashing works (test with known hash)
3. Confirm API response format hasn't changed

### Issue: Slow performance

**Cause:** Network latency or API throttling

**Solutions:**

1. Add debouncing for real-time checks
2. Only check on form submit (current implementation)
3. Consider timeout for API call (not currently implemented)

## References

- [Have I Been Pwned API Documentation](https://haveibeenpwned.com/API/v3)
- [HIBP k-Anonymity Model](https://www.troyhunt.com/ive-just-launched-pwned-passwords-version-2/)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

## License

This composable is part of the Ju Keramia project and follows the same license.
