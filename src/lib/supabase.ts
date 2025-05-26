import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a base client without auth
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      assets: {
        Row: {
          id: string;
          serial_number: string;
          asset_class: string;
          assigned_user_id: string | null;
          issue_date: string | null;
          last_certification_date: string | null;
          next_certification_date: string | null;
          status: string;
          org_id: string;
          glove_size: string | null;
          glove_color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['assets']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['assets']['Insert']>;
      };
    };
  };
};

// Create an authenticated client
export const createAuthenticatedClient = (token: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

// For backward compatibility
export const createSupabaseClient = createAuthenticatedClient; 