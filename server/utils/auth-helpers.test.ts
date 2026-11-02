import { describe, expect, it } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { sanitizeUser } from './auth-helpers';

const PUBLIC_USER_FIELDS = ['created_at', 'email', 'id', 'updated_at', 'user_metadata'];

// Synthetic user only: contains the sensitive/internal Supabase fields that must never
// reach browser code, so the tests can prove they are stripped.
const syntheticUser: User = {
  id: '00000000-0000-4000-8000-000000000000',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'synthetic.user@example.com',
  phone: '+10000000000',
  created_at: '2025-01-01T10:00:00.000Z',
  updated_at: '2025-01-02T10:00:00.000Z',
  last_sign_in_at: '2025-01-03T10:00:00.000Z',
  email_confirmed_at: '2025-01-01T10:05:00.000Z',
  user_metadata: { display_name: 'Synthetic User' },
  app_metadata: { provider: 'email', providers: ['email'], role: 'admin' },
  identities: [
    {
      id: '00000000-0000-4000-8000-000000000001',
      identity_id: '00000000-0000-4000-8000-000000000002',
      user_id: '00000000-0000-4000-8000-000000000000',
      identity_data: { email: 'synthetic.user@example.com' },
      provider: 'email',
      last_sign_in_at: '2025-01-03T10:00:00.000Z',
      created_at: '2025-01-01T10:00:00.000Z',
      updated_at: '2025-01-02T10:00:00.000Z',
    },
  ],
};

describe('sanitizeUser', () => {
  it('returns null for a null user', () => {
    expect(sanitizeUser(null)).toBeNull();
  });

  it('preserves the public user fields', () => {
    expect(sanitizeUser(syntheticUser)).toEqual({
      id: syntheticUser.id,
      email: syntheticUser.email,
      user_metadata: syntheticUser.user_metadata,
      created_at: syntheticUser.created_at,
      updated_at: syntheticUser.updated_at,
    });
  });

  it('returns only the public user fields', () => {
    expect(Object.keys(sanitizeUser(syntheticUser) ?? {}).sort()).toEqual(PUBLIC_USER_FIELDS);
  });

  it('does not return sensitive or internal Supabase user fields', () => {
    const sanitized = sanitizeUser(syntheticUser);

    expect(sanitized).not.toHaveProperty('app_metadata');
    expect(sanitized).not.toHaveProperty('identities');
  });
});
