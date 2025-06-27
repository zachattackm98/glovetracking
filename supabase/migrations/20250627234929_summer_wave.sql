/*
  # Fix RLS Policies to Use auth.jwt() Syntax

  This migration updates all RLS policies to use the correct auth.jwt() ->> 'claim_name' 
  syntax instead of current_setting() for reading JWT claims from Clerk authentication.

  ## Changes Made
  1. Update all policies on assets table to use auth.jwt() syntax
  2. Update all policies on certification_documents table to use auth.jwt() syntax
  3. Ensure proper claim extraction for org_id, org_role, and user_id

  ## Security
  - Maintains the same security logic but with correct JWT claim reading
  - Ensures RLS policies work properly with Clerk authentication
*/

-- Drop and recreate all RLS policies for assets table
DROP POLICY IF EXISTS "Users can view assets based on role and assignment" ON assets;
DROP POLICY IF EXISTS "Users can insert assets in their organization" ON assets;
DROP POLICY IF EXISTS "Users can update assets based on role and assignment" ON assets;
DROP POLICY IF EXISTS "Admins can delete assets in their organization" ON assets;
DROP POLICY IF EXISTS "Service role can manage all assets" ON assets;

-- Assets table policies with corrected JWT syntax
CREATE POLICY "Users can view assets based on role and assignment"
  ON assets
  FOR SELECT
  TO authenticated
  USING (
    org_id = (auth.jwt() ->> 'org_id') AND (
      -- User is admin in the organization - can see all assets
      (auth.jwt() ->> 'org_role') = 'org:admin' OR
      -- User is member and asset is assigned to them
      (
        (auth.jwt() ->> 'org_role') = 'org:member' AND
        assigned_user_id = (auth.jwt() ->> 'user_id')
      )
    )
  );

CREATE POLICY "Users can insert assets in their organization"
  ON assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id') AND
    (
      (auth.jwt() ->> 'org_role') = 'org:admin' OR
      (auth.jwt() ->> 'org_role') = 'org:member'
    )
  );

CREATE POLICY "Users can update assets based on role and assignment"
  ON assets
  FOR UPDATE
  TO authenticated
  USING (
    org_id = (auth.jwt() ->> 'org_id') AND (
      -- User is admin in the organization - can update all assets
      (auth.jwt() ->> 'org_role') = 'org:admin' OR
      -- User is member and asset is assigned to them
      (
        (auth.jwt() ->> 'org_role') = 'org:member' AND
        assigned_user_id = (auth.jwt() ->> 'user_id')
      )
    )
  )
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id') AND (
      -- User is admin in the organization - can update all assets
      (auth.jwt() ->> 'org_role') = 'org:admin' OR
      -- User is member and asset is assigned to them
      (
        (auth.jwt() ->> 'org_role') = 'org:member' AND
        assigned_user_id = (auth.jwt() ->> 'user_id')
      )
    )
  );

CREATE POLICY "Admins can delete assets in their organization"
  ON assets
  FOR DELETE
  TO authenticated
  USING (
    org_id = (auth.jwt() ->> 'org_id') AND
    (auth.jwt() ->> 'org_role') = 'org:admin'
  );

CREATE POLICY "Service role can manage all assets"
  ON assets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Drop and recreate all RLS policies for certification_documents table
DROP POLICY IF EXISTS "Users can view certification documents in their organization" ON certification_documents;
DROP POLICY IF EXISTS "Users can insert certification documents in their organization" ON certification_documents;
DROP POLICY IF EXISTS "Admins can delete certification documents in their organization" ON certification_documents;
DROP POLICY IF EXISTS "Admins can update certification documents in their organization" ON certification_documents;
DROP POLICY IF EXISTS "Service role can manage all certification documents" ON certification_documents;

-- Certification documents table policies with corrected JWT syntax
CREATE POLICY "Users can view certification documents in their organization"
  ON certification_documents
  FOR SELECT
  TO authenticated
  USING (
    org_id = (auth.jwt() ->> 'org_id') AND (
      -- User is admin in the organization
      (auth.jwt() ->> 'org_role') = 'org:admin' OR
      -- User is assigned to the asset this document belongs to
      EXISTS (
        SELECT 1 FROM assets 
        WHERE assets.id = certification_documents.asset_id 
        AND assets.assigned_user_id = (auth.jwt() ->> 'user_id')
      )
    )
  );

CREATE POLICY "Users can insert certification documents in their organization"
  ON certification_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id') AND
    (
      (auth.jwt() ->> 'org_role') = 'org:admin' OR
      (auth.jwt() ->> 'org_role') = 'org:member'
    ) AND
    -- Ensure the asset belongs to the same organization
    EXISTS (
      SELECT 1 FROM assets 
      WHERE assets.id = certification_documents.asset_id 
      AND assets.org_id = (auth.jwt() ->> 'org_id')
    )
  );

CREATE POLICY "Admins can delete certification documents in their organization"
  ON certification_documents
  FOR DELETE
  TO authenticated
  USING (
    org_id = (auth.jwt() ->> 'org_id') AND
    (auth.jwt() ->> 'org_role') = 'org:admin'
  );

CREATE POLICY "Admins can update certification documents in their organization"
  ON certification_documents
  FOR UPDATE
  TO authenticated
  USING (
    org_id = (auth.jwt() ->> 'org_id') AND
    (auth.jwt() ->> 'org_role') = 'org:admin'
  )
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id') AND
    (auth.jwt() ->> 'org_role') = 'org:admin'
  );

CREATE POLICY "Service role can manage all certification documents"
  ON certification_documents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);