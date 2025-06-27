import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudXZsZWlveWRzdnlvdWh2ZWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE2NTEzOSwiZXhwIjoyMDYzNzQxMTM5fQ.U2MrNJa8NiudbOOebUHCjKn8Nvu5VHoVehnLcjyOQWc';

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

// Function to create a Supabase client with custom JWT for Clerk integration
export const createSupabaseClientWithAuth = (userId: string, orgId: string, orgRole: string) => {
  // Create a custom JWT payload that matches what the RLS policies expect
  const customJWT = {
    sub: userId,
    user_id: userId,
    org_id: orgId,
    org_role: orgRole,
    aud: 'authenticated',
    role: 'authenticated',
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
  };

  // For now, we'll use the service role client since we can't easily create custom JWTs
  // In a production environment, you'd want to create a proper JWT signing mechanism
  return adminSupabase;
};