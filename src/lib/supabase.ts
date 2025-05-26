import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Singleton instance
let authenticatedClient: SupabaseClient | null = null;

// Create an authenticated client
export const createAuthenticatedClient = (token: string) => {
  if (authenticatedClient) {
    // Update the auth header if client exists
    authenticatedClient.auth.setSession({
      access_token: token,
      refresh_token: '',
    });
    return authenticatedClient;
  }

  // Create new client if none exists
  authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  return authenticatedClient;
};

// For backward compatibility
export const createSupabaseClient = createAuthenticatedClient;