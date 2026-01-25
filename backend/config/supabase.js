import { createClient } from '@supabase/supabase-js';
import { ENV } from './env.js';

const isSupabaseConfigured = ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY && ENV.SUPABASE_SERVICE_ROLE_KEY;

export const getServiceClient = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado corretamente (URL, Anon Key ou Service Role Key faltando)');
  }
  return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export const getAnonClient = () => {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) return null;
  return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, { 
    auth: { persistSession: false, autoRefreshToken: false } 
  });
};

export { isSupabaseConfigured };
