/*
  # Implement Row Level Security for certification_documents table

  1. Security Setup
    - Enable RLS on certification_documents table
    - Clean up existing policies
    - Create refined policies for proper access control

  2. Access Control Logic
    - Users can view documents in their organization if they're assigned to the asset or are admins
    - Users can insert documents for assets in their organization
    - Only admins can delete/update documents in their organization

  3. Security Features
    - Organization-based isolation
    - Role-based permissions
    - Asset ownership validation
*/

-- Enable Row Level Security on certification_documents table
ALTER TABLE certification_documents ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can delete certification documents" ON certification_documents;
DROP POLICY IF EXISTS "Admins can insert certification documents" ON certification_documents;
DROP POLICY IF EXISTS "Admins can manage all certification documents in their organiza" ON certification_documents;
DROP POLICY IF EXISTS "Admins can manage certification documents" ON certification_documents;
DROP POLICY IF EXISTS "Admins can manage certification documents in their organization" ON certification_documents;
DROP POLICY IF EXISTS "Org members can read certification documents" ON certification_documents;
DROP POLICY IF EXISTS "Users can insert certification documents in their organization" ON certification_documents;
DROP POLICY IF EXISTS "Users can view certification documents in their organization" ON certification_documents;

-- Create refined RLS policies

-- Policy 1: SELECT - Users can view certification documents in their organization
-- Logic: Users can see documents if they belong to the same organization AND either:
-- - They are assigned to the asset the document belongs to, OR
-- - They have admin role in the organization
CREATE POLICY "Users can view certification documents in their organization"
  ON certification_documents
  FOR SELECT
  TO authenticated
  USING (
    org_id = current_setting('request.jwt.claims.org_id'::text, true) AND (
      -- User is admin in the organization
      current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'::text OR
      -- User is assigned to the asset this document belongs to
      EXISTS (
        SELECT 1 FROM assets 
        WHERE assets.id = certification_documents.asset_id 
        AND assets.assigned_user_id = current_setting('request.jwt.claims.user_id'::text, true)
      )
    )
  );

-- Policy 2: INSERT - Authenticated users can insert documents in their organization
-- Logic: Users can insert documents if they belong to the same organization as the asset
-- and they have either admin or member role
CREATE POLICY "Users can insert certification documents in their organization"
  ON certification_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = current_setting('request.jwt.claims.org_id'::text, true) AND
    (
      current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'::text OR
      current_setting('request.jwt.claims.org_role'::text, true) = 'org:member'::text
    ) AND
    -- Ensure the asset belongs to the same organization
    EXISTS (
      SELECT 1 FROM assets 
      WHERE assets.id = certification_documents.asset_id 
      AND assets.org_id = current_setting('request.jwt.claims.org_id'::text, true)
    )
  );

-- Policy 3: DELETE - Only admins can delete certification documents
-- Logic: Only users with admin role in the organization can delete documents
CREATE POLICY "Admins can delete certification documents in their organization"
  ON certification_documents
  FOR DELETE
  TO authenticated
  USING (
    org_id = current_setting('request.jwt.claims.org_id'::text, true) AND
    current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'::text
  );

-- Policy 4: UPDATE - Only admins can update certification documents
-- Logic: Only users with admin role in the organization can update documents
CREATE POLICY "Admins can update certification documents in their organization"
  ON certification_documents
  FOR UPDATE
  TO authenticated
  USING (
    org_id = current_setting('request.jwt.claims.org_id'::text, true) AND
    current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'::text
  )
  WITH CHECK (
    org_id = current_setting('request.jwt.claims.org_id'::text, true) AND
    current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'::text
  );

-- Policy 5: Service role bypass - Allow service role full access for backend operations
CREATE POLICY "Service role can manage all certification documents"
  ON certification_documents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);