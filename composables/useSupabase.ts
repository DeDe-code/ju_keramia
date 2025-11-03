import { createClient } from '@supabase/supabase-js';
import { useRuntimeConfig } from '#app';

export const useSupabase = () => {
  const config = useRuntimeConfig();
  const supabaseUrl = config.public.supabaseUrl;
  const supabaseKey = config.public.supabaseAnonKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and anon key must be set in environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
};
