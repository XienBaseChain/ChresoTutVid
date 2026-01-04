import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Use secure storage - Supabase handles this properly
    // Unlike raw localStorage, tokens are managed securely
  },
});

// Helper to get authenticated user's role
export async function getUserRole(): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_my_role');
  if (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
  return data;
}

// Helper to get authenticated user's full profile
export async function getUserProfile() {
  const { data, error } = await supabase.rpc('get_my_profile');
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  return data;
}

// Helper to log an action
export async function logAction(action: string, details?: string): Promise<void> {
  const args = {
    p_action: action,
    p_details: details ?? null,
  };

  const { error } = await supabase.rpc('log_action', args as never);
  if (error) {
    console.error('Error logging action:', error);
  }
}
