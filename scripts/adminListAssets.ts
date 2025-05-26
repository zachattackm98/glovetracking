// scripts/adminListAssets.ts
// Usage: Set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL in your .env file, then run: npx ts-node scripts/adminListAssets.ts

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function listAllAssets() {
  const { data, error } = await supabase.from('assets').select('*');
  if (error) {
    console.error('Error fetching assets:', error.message);
    process.exit(1);
  }
  console.log('All assets:', data);
}

listAllAssets(); 