/*
  # Implement Row Level Security for certification_documents table

  1. Enable RLS
    - Enable Row Level Security on the certification_documents table
  
  2. Clean up existing policies
    - Drop all existing RLS policies to avoid conflicts and redundancy
  
  3. Create refined RLS policies
    - SELECT: Users can view documents in their organization (assigned assets or admin role)
    - INSERT: Authenticated users can insert documents in their organization
    - DELETE: Only admins can delete documents in their organization
  
  4. Security
    - Organization-based access control
    - Role-based permissions (admin vs member)
    - JWT claims validation for user authentication
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
    org_id = (jwt() ->> 'org_id'::text) AND (
      -- User is admin in the organization
      (jwt() ->> 'org_role'::text) = 'org:admin'::text OR
      -- User is assigned to the asset this document belongs to
      EXISTS (
        SELECT 1 FROM assets 
        WHERE assets.id = certification_documents.asset_id 
        AND assets.assigned_user_id = (jwt() ->> 'user_id'::text)
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
    org_id = (jwt() ->> 'org_id'::text) AND
    (
      (jwt() ->> 'org_role'::text) = 'org:admin'::text OR
      (jwt() ->> 'org_role'::text) = 'org:member'::text
    ) AND
    -- Ensure the asset belongs to the same organization
    EXISTS (
      SELECT 1 FROM assets 
      WHERE assets.id = certification_documents.asset_id 
      AND assets.org_id = (jwt() ->> 'org_id'::text)
    )
  );

-- Policy 3: DELETE - Only admins can delete certification documents
-- Logic: Only users with admin role in the organization can delete documents
CREATE POLICY "Admins can delete certification documents in their organization"
  ON certification_documents
  FOR DELETE
  TO authenticated
  USING (
    org_id = (jwt() ->> 'org_id'::text) AND
    (jwt() ->> 'org_role'::text) = 'org:admin'::text
  );

-- Policy 4: UPDATE - Only admins can update certification documents
-- Logic: Only users with admin role in the organization can update documents
CREATE POLICY "Admins can update certification documents in their organization"
  ON certification_documents
  FOR UPDATE
  TO authenticated
  USING (
    org_id = (jwt() ->> 'org_id'::text) AND
    (jwt() ->> 'org_role'::text) = 'org:admin'::text
  )
  WITH CHECK (
    org_id = (jwt() ->> 'org_id'::text) AND
    (jwt() ->> 'org_role'::text) = 'org:admin'::text
  );