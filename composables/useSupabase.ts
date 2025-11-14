import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Singleton instance with proper typing
let supabaseClient: SupabaseClient<Database> | null = null;

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

  // Create and cache the typed client
  supabaseClient = createClient<Database>(supabaseUrl, supabaseKey);
  return supabaseClient;
};
