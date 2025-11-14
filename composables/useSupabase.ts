import { createClient } from '@supabase/supabase-js';

// Singleton instance
let supabaseClient: ReturnType<typeof createClient> | null = null;

export const useSupabase = () => {
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient;
  }

  const config = useRuntimeConfig();
  const supabaseUrl = config.public.supabaseUrl;
  const supabaseKey = config.public.supabaseAnonKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and anon key must be set in environment variables');
  }

  // Create and cache the client
  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
};
