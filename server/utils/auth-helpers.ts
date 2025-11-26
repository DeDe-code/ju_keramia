/**
 * Auth Helper Utilities for Server
 *
 * Server-side utilities for sanitizing and processing auth data.
 */

import type { User } from '@supabase/supabase-js';

/**
 * Sanitize user object (remove sensitive fields)
 * Returns only safe, non-sensitive user fields
 */
export const sanitizeUser = (user: User | null): User | null => {
  if (!user) return null;

  const { id, email, user_metadata, created_at, updated_at } = user;

  return {
    id,
    email,
    user_metadata,
    created_at,
    updated_at,
  } as User;
};
