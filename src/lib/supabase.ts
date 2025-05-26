import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Regular client for authenticated users
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function for admin operations
export const adminOperation = async (operation: string, data: any) => {
  const response = await fetch(`${supabaseUrl}/functions/v1/admin-operations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ operation, data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Operation failed');
  }

  return response.json();
};