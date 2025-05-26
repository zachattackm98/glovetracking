/*
  # Fix RLS policies for assets table

  1. Changes
    - Fix type casting issues between UUID and text types
    - Drop existing policies
    - Create new simplified policies with proper type handling

  2. Security
    - Enable RLS policies for organization-based access control
    - Maintain role-based access control for admins and users
    - Ensure proper type casting for UUID comparisons
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

-- Create new simplified policies with proper type casting
CREATE POLICY "Enable read access for users in same organization"
ON assets
FOR SELECT
TO authenticated
USING (
  org_id = (auth.jwt() ->> 'org_id')
);

CREATE POLICY "Enable insert for users in same organization"
ON assets
FOR INSERT
TO authenticated
WITH CHECK (
  org_id = (auth.jwt() ->> 'org_id')
);

CREATE POLICY "Enable update for admins and assigned users"
ON assets
FOR UPDATE
TO authenticated
USING (
  org_id = (auth.jwt() ->> 'org_id')
  AND (
    (auth.jwt() ->> 'org_role') = 'org:admin'
    OR assigned_user_id = auth.uid()::text
  )
)
WITH CHECK (
  org_id = (auth.jwt() ->> 'org_id')
  AND (
    (auth.jwt() ->> 'org_role') = 'org:admin'
    OR assigned_user_id = auth.uid()::text
  )
);

CREATE POLICY "Enable delete for admins only"
ON assets
FOR DELETE
TO authenticated
USING (
  org_id = (auth.jwt() ->> 'org_id')
  AND (auth.jwt() ->> 'org_role') = 'org:admin'
);