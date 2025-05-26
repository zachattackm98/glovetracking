import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY');
}

// Regular client for authenticated users
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Admin client with service role key that bypasses RLS
export const adminSupabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey, // Fallback to anon key if service key not available
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Function to get Supabase client with Clerk session
export const getSupabaseClient = async () => {
  try {
    const token = await fetch('/.netlify/functions/get-supabase-token').then(r => r.text());
    
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  } catch (error) {
    console.error('Error getting Supabase token:', error);
    return supabase; // Fall back to anonymous client
  }
};