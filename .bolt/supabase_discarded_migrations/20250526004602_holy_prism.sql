/*
  # Update RLS policies for assets table
  
  1. Changes
    - Use IF NOT EXISTS for policy creation to avoid conflicts
    - Keep explicit type casting for better type safety
    - Maintain same policy logic and access controls
  
  2. Security
    - Maintain organization-based access control
    - Keep admin-only delete permissions
    - Allow assigned users to update their assets
*/

-- First drop any existing policies with these exact names
DROP POLICY IF EXISTS "Enable read access for users in same organization" ON assets;
DROP POLICY IF EXISTS "Enable insert for users in same organization" ON assets;
DROP POLICY IF EXISTS "Enable update for admins and assigned users" ON assets;
DROP POLICY IF EXISTS "Enable delete for admins only" ON assets;

-- Then drop any other existing policies to ensure clean slate
DROP POLICY IF EXISTS "Admins can delete assets" ON assets;
DROP POLICY IF EXISTS "Admins can insert assets" ON assets;
DROP POLICY IF EXISTS "Admins can manage all assets in their organization" ON assets;
DROP POLICY IF EXISTS "Admins can update assets" ON assets;
DROP POLICY IF EXISTS "Members can manage their own assets" ON assets;
DROP POLICY IF EXISTS "Members can read their assigned assets" ON assets;
DROP POLICY IF EXISTS "Members can update their own assigned assets" ON assets;
DROP POLICY IF EXISTS "Members can view their assigned assets" ON assets;
DROP POLICY IF EXISTS "Users can insert assets in their organization" ON assets;
DROP POLICY IF EXISTS "Users can view assets in their organization" ON assets;

-- Create new policies with explicit type casting and clear naming
CREATE POLICY IF NOT EXISTS "assets_read_policy"
ON assets
FOR SELECT
TO authenticated
USING (
  org_id::text = (auth.jwt() ->> 'org_id')::text
);

CREATE POLICY IF NOT EXISTS "assets_insert_policy"
ON assets
FOR INSERT
TO authenticated
WITH CHECK (
  org_id::text = (auth.jwt() ->> 'org_id')::text
);

CREATE POLICY IF NOT EXISTS "assets_update_policy"
ON assets
FOR UPDATE
TO authenticated
USING (
  org_id::text = (auth.jwt() ->> 'org_id')::text
  AND (
    (auth.jwt() ->> 'org_role')::text = 'org:admin'
    OR assigned_user_id::text = auth.uid()::text
  )
)
WITH CHECK (
  org_id::text = (auth.jwt() ->> 'org_id')::text
  AND (
    (auth.jwt() ->> 'org_role')::text = 'org:admin'
    OR assigned_user_id::text = auth.uid()::text
  )
);

CREATE POLICY IF NOT EXISTS "assets_delete_policy"
ON assets
FOR DELETE
TO authenticated
USING (
  org_id::text = (auth.jwt() ->> 'org_id')::text
  AND (auth.jwt() ->> 'org_role')::text = 'org:admin'
);