/*
  # Update RLS policies for assets table

  1. Security Changes
    - Enable RLS on assets table (if not already enabled)
    - Drop existing policies to start fresh
    - Create granular policies for different user roles

  2. New Policies
    - SELECT: Admins see all org assets, members see only assigned assets
    - INSERT: Admins and members can create assets in their org
    - UPDATE: Admins can update all org assets, members can update only assigned assets
    - DELETE: Only admins can delete assets in their org
    - Service role bypass for backend operations

  3. Access Control Logic
    - Organization-based isolation (org_id matching)
    - Role-based permissions (org:admin vs org:member)
    - Asset assignment-based access for members
*/

-- Enable Row Level Security on assets table
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can manage all assets in their organization" ON assets;
DROP POLICY IF EXISTS "Members can update their own assigned assets" ON assets;
DROP POLICY IF EXISTS "Users can insert assets in their organization" ON assets;
DROP POLICY IF EXISTS "Users can view assets in their organization" ON assets;
DROP POLICY IF EXISTS "Service role can manage all assets" ON assets;

-- Policy 1: SELECT - Admins can view all org assets, members can view only assigned assets
CREATE POLICY "Users can view assets based on role and assignment"
  ON assets
  FOR SELECT
  TO authenticated
  USING (
    org_id = current_setting('request.jwt.claims.org_id'::text, true) AND (
      -- User is admin in the organization - can see all assets
      current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'::text OR
      -- User is member and asset is assigned to them
      (
        current_setting('request.jwt.claims.org_role'::text, true) = 'org:member'::text AND
        assigned_user_id = current_setting('request.jwt.claims.user_id'::text, true)
      )
    )
  );

-- Policy 2: INSERT - Authenticated users can insert assets in their organization
CREATE POLICY "Users can insert assets in their organization"
  ON assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = current_setting('request.jwt.claims.org_id'::text, true) AND
    (
      current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'::text OR
      current_setting('request.jwt.claims.org_role'::text, true) = 'org:member'::text
    )
  );

-- Policy 3: UPDATE - Admins can update all org assets, members can update only assigned assets
CREATE POLICY "Users can update assets based on role and assignment"
  ON assets
  FOR UPDATE
  TO authenticated
  USING (
    org_id = current_setting('request.jwt.claims.org_id'::text, true) AND (
      -- User is admin in the organization - can update all assets
      current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'::text OR
      -- User is member and asset is assigned to them
      (
        current_setting('request.jwt.claims.org_role'::text, true) = 'org:member'::text AND
        assigned_user_id = current_setting('request.jwt.claims.user_id'::text, true)
      )
    )
  )
  WITH CHECK (
    org_id = current_setting('request.jwt.claims.org_id'::text, true) AND (
      -- User is admin in the organization - can update all assets
      current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'::text OR
      -- User is member and asset is assigned to them
      (
        current_setting('request.jwt.claims.org_role'::text, true) = 'org:member'::text AND
        assigned_user_id = current_setting('request.jwt.claims.user_id'::text, true)
      )
    )
  );

-- Policy 4: DELETE - Only admins can delete assets in their organization
CREATE POLICY "Admins can delete assets in their organization"
  ON assets
  FOR DELETE
  TO authenticated
  USING (
    org_id = current_setting('request.jwt.claims.org_id'::text, true) AND
    current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'::text
  );

-- Policy 5: Service role bypass - Allow service role full access for backend operations
CREATE POLICY "Service role can manage all assets"
  ON assets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);