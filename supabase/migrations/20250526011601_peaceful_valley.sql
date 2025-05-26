/*
  # Update RLS policies for assets table
  
  1. Changes
    - Enable RLS on assets table if not already enabled
    - Drop all existing policies to ensure clean slate
    - Create new policies for CRUD operations with proper role checks
  
  2. Security
    - Ensures org-level isolation
    - Admins can manage all assets in their org
    - Members can only manage assigned assets
*/

-- First ensure RLS is enabled
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "assets_read_policy" ON assets;
DROP POLICY IF EXISTS "assets_insert_policy" ON assets;
DROP POLICY IF EXISTS "assets_update_policy" ON assets;
DROP POLICY IF EXISTS "assets_delete_policy" ON assets;

-- Create new policies
CREATE POLICY "assets_read_policy"
ON assets
FOR SELECT
TO authenticated
USING (
  org_id = current_setting('request.jwt.claims.org_id'::text, true)
);

CREATE POLICY "assets_insert_policy"
ON assets
FOR INSERT
TO authenticated
WITH CHECK (
  org_id = current_setting('request.jwt.claims.org_id'::text, true)
);

CREATE POLICY "assets_update_policy"
ON assets
FOR UPDATE
TO authenticated
USING (
  org_id = current_setting('request.jwt.claims.org_id'::text, true)
  AND (
    current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'
    OR assigned_user_id = auth.uid()
  )
)
WITH CHECK (
  org_id = current_setting('request.jwt.claims.org_id'::text, true)
  AND (
    current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'
    OR assigned_user_id = auth.uid()
  )
);

CREATE POLICY "assets_delete_policy"
ON assets
FOR DELETE
TO authenticated
USING (
  org_id = current_setting('request.jwt.claims.org_id'::text, true)
  AND current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'
);