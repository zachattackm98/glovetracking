import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { useAuth } from '@clerk/clerk-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Regular client for authenticated users
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Admin client with service role key that bypasses RLS
export const adminSupabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Function to get Supabase client with Clerk session
export const getSupabaseClient = async () => {
  const { getToken } = useAuth();
  
  try {
    const token = await getToken({ template: 'supabase' });
    
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  } catch (error) {
    console.error('Error getting Clerk session:', error);
    return supabase; // Fall back to anonymous client
  }
};