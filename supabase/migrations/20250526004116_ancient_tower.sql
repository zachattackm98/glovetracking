/*
  # Update assets table RLS policies

  1. Changes
    - Simplify and fix RLS policies for the assets table
    - Ensure proper access control for both admins and members
    - Fix policy conditions to use proper JWT claims

  2. Security
    - Maintain RLS enabled on assets table
    - Update policies to properly handle organization-level access
    - Ensure proper authentication checks
*/

-- Drop existing policies to clean up
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

-- Create new simplified policies
CREATE POLICY "Enable read access for users in same organization"
ON assets
FOR SELECT
TO authenticated
USING (
  org_id = (auth.jwt() ->> 'org_id')::text
);

CREATE POLICY "Enable insert for users in same organization"
ON assets
FOR INSERT
TO authenticated
WITH CHECK (
  org_id = (auth.jwt() ->> 'org_id')::text
);

CREATE POLICY "Enable update for admins and assigned users"
ON assets
FOR UPDATE
TO authenticated
USING (
  org_id = (auth.jwt() ->> 'org_id')::text
  AND (
    (auth.jwt() ->> 'org_role')::text = 'org:admin'
    OR assigned_user_id = auth.uid()
  )
)
WITH CHECK (
  org_id = (auth.jwt() ->> 'org_id')::text
  AND (
    (auth.jwt() ->> 'org_role')::text = 'org:admin'
    OR assigned_user_id = auth.uid()
  )
);

CREATE POLICY "Enable delete for admins only"
ON assets
FOR DELETE
TO authenticated
USING (
  org_id = (auth.jwt() ->> 'org_id')::text
  AND (auth.jwt() ->> 'org_role')::text = 'org:admin'
);