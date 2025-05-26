/*
  # Update RLS policies for Clerk integration
  
  1. Changes
    - Update RLS policies to work with Clerk JWT claims
    - Add org_id check to all policies
    - Enable RLS on both tables
    
  2. Security
    - Ensure users can only access assets within their organization
    - Allow admins full access to their org's assets
    - Allow members to view all assets but only modify their assigned ones
*/

-- Enable RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "assets_read_policy" ON assets;
DROP POLICY IF EXISTS "assets_insert_policy" ON assets;
DROP POLICY IF EXISTS "assets_update_policy" ON assets;
DROP POLICY IF EXISTS "assets_delete_policy" ON assets;

DROP POLICY IF EXISTS "certification_documents_select_policy" ON certification_documents;
DROP POLICY IF EXISTS "certification_documents_insert_policy" ON certification_documents;
DROP POLICY IF EXISTS "certification_documents_delete_policy" ON certification_documents;

-- Create new policies for assets
CREATE POLICY "Enable read access for users in same org"
ON assets FOR SELECT
TO authenticated
USING (
  org_id = coalesce(
    current_setting('request.jwt.claims.org_id'::text, true),
    current_setting('request.jwt.claims.organization_id'::text, true)
  )
);

CREATE POLICY "Enable insert access for users in same org"
ON assets FOR INSERT
TO authenticated
WITH CHECK (
  org_id = coalesce(
    current_setting('request.jwt.claims.org_id'::text, true),
    current_setting('request.jwt.claims.organization_id'::text, true)
  )
);

CREATE POLICY "Enable update access for admins and assigned users"
ON assets FOR UPDATE
TO authenticated
USING (
  org_id = coalesce(
    current_setting('request.jwt.claims.org_id'::text, true),
    current_setting('request.jwt.claims.organization_id'::text, true)
  )
  AND (
    current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'
    OR assigned_user_id = current_setting('request.jwt.claims.sub'::text, true)
  )
)
WITH CHECK (
  org_id = coalesce(
    current_setting('request.jwt.claims.org_id'::text, true),
    current_setting('request.jwt.claims.organization_id'::text, true)
  )
  AND (
    current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'
    OR assigned_user_id = current_setting('request.jwt.claims.sub'::text, true)
  )
);

CREATE POLICY "Enable delete access for admins"
ON assets FOR DELETE
TO authenticated
USING (
  org_id = coalesce(
    current_setting('request.jwt.claims.org_id'::text, true),
    current_setting('request.jwt.claims.organization_id'::text, true)
  )
  AND current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'
);

-- Create new policies for certification documents
CREATE POLICY "Enable read access for certification documents in same org"
ON certification_documents FOR SELECT
TO authenticated
USING (
  org_id = coalesce(
    current_setting('request.jwt.claims.org_id'::text, true),
    current_setting('request.jwt.claims.organization_id'::text, true)
  )
);

CREATE POLICY "Enable insert access for certification documents in same org"
ON certification_documents FOR INSERT
TO authenticated
WITH CHECK (
  org_id = coalesce(
    current_setting('request.jwt.claims.org_id'::text, true),
    current_setting('request.jwt.claims.organization_id'::text, true)
  )
);

CREATE POLICY "Enable delete access for certification documents for admins"
ON certification_documents FOR DELETE
TO authenticated
USING (
  org_id = coalesce(
    current_setting('request.jwt.claims.org_id'::text, true),
    current_setting('request.jwt.claims.organization_id'::text, true)
  )
  AND current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'
);