/**
 * Client-side password leak detection using Have I Been Pwned API.
 * Uses k-Anonymity model - only sends first 5 characters of SHA-1 hash.
 *
 * @see https://haveibeenpwned.com/API/v3#PwnedPasswords
 */
export const usePasswordLeakCheck = () => {
  const isChecking = ref(false);
  const error = ref<string | null>(null);

  /**
   * Check if a password appears in known breach databases.
   *
   * @param password - The password to check
   * @returns true if password is leaked/compromised, false if safe
   */
  const checkPassword = async (password: string): Promise<boolean> => {
    if (!password) {
      return false;
    }

    isChecking.value = true;
    error.value = null;

    try {
      // Generate SHA-1 hash of password
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);

      // Convert to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();

      // Use k-Anonymity: send only first 5 chars
      const prefix = hashHex.slice(0, 5);
      const suffix = hashHex.slice(5);

      // Query HIBP API with prefix
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        method: 'GET',
        headers: {
          'Add-Padding': 'true', // Additional privacy protection
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check password');
      }

      const text = await response.text();

      // Check if our suffix appears in the response
      const hashes = text.split('\n');
      const isLeaked = hashes.some((line) => {
        const [hashSuffix] = line.split(':');
        return hashSuffix === suffix;
      });

      return isLeaked;
    } catch (err) {
      console.error('Password leak check failed:', err);
      error.value = err instanceof Error ? err.message : 'Check failed';

      // Fail open - don't block user if API is down
      return false;
    } finally {
      isChecking.value = false;
    }
  };

  /**
   * Check password and return user-friendly message.
   *
   * @param password - The password to check
   * @returns Object with isLeaked boolean and message string
   */
  const checkPasswordWithMessage = async (
    password: string
  ): Promise<{ isLeaked: boolean; message: string | null }> => {
    const isLeaked = await checkPassword(password);

    if (error.value) {
      return {
        isLeaked: false,
        message: 'Unable to verify password security. Please try again.',
      };
    }

    if (isLeaked) {
      return {
        isLeaked: true,
        message:
          'This password has appeared in a known data breach. Please choose a different password.',
      };
    }

    return {
      isLeaked: false,
      message: null,
    };
  };

  /**
   * Reset state (useful for clearing errors).
   */
  const reset = () => {
    isChecking.value = false;
    error.value = null;
  };

  return {
    checkPassword,
    checkPasswordWithMessage,
    isChecking: readonly(isChecking),
    error: readonly(error),
    reset,
  };
};
