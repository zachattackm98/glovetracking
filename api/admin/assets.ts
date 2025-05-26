// api/admin/assets.ts
// Next.js API route for admin asset creation using Supabase service role key
// Only allow access if the user is an admin (org_role === 'org:admin')

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Example: Extract user info from headers or session (customize as needed)
  const orgRole = req.headers['x-org-role'] || req.body.org_role;
  if (orgRole !== 'org:admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }

  const asset = req.body;
  const { data, error } = await supabase.from('assets').insert([asset]);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ data });
} 