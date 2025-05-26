/*
  # Fix RLS policies for assets and certification documents

  1. Changes
    - Simplify RLS policies to use only org_id from JWT claims
    - Remove complex conditions and unnecessary checks
    - Keep basic CRUD operations for organization members
    - Ensure admins can manage all assets in their org
    
  2. Security
    - Enable RLS on both tables
    - Restrict access by organization
    - Allow admins full control
    - Allow members to read all assets in their org
*/

-- Enable RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for users in same org" ON assets;
DROP POLICY IF EXISTS "Enable insert access for users in same org" ON assets;
DROP POLICY IF EXISTS "Enable update access for admins" ON assets;
DROP POLICY IF EXISTS "Enable delete access for admins" ON assets;

DROP POLICY IF EXISTS "Enable read access for certification documents in same org" ON certification_documents;
DROP POLICY IF EXISTS "Enable insert access for certification documents in same org" ON certification_documents;
DROP POLICY IF EXISTS "Enable delete access for certification documents for admins" ON certification_documents;

-- Create simplified policies for assets
CREATE POLICY "Enable read access for users in same org"
ON assets FOR SELECT
TO authenticated
USING (org_id = current_setting('request.jwt.claims.org_id'::text));

CREATE POLICY "Enable insert access for users in same org"
ON assets FOR INSERT
TO authenticated
WITH CHECK (org_id = current_setting('request.jwt.claims.org_id'::text));

CREATE POLICY "Enable update access for admins"
ON assets FOR UPDATE
TO authenticated
USING (
  org_id = current_setting('request.jwt.claims.org_id'::text)
  AND current_setting('request.jwt.claims.org_role'::text) = 'org:admin'
);

CREATE POLICY "Enable delete access for admins"
ON assets FOR DELETE
TO authenticated
USING (
  org_id = current_setting('request.jwt.claims.org_id'::text)
  AND current_setting('request.jwt.claims.org_role'::text) = 'org:admin'
);

-- Create simplified policies for certification documents
CREATE POLICY "Enable read access for certification documents in same org"
ON certification_documents FOR SELECT
TO authenticated
USING (org_id = current_setting('request.jwt.claims.org_id'::text));

CREATE POLICY "Enable insert access for certification documents in same org"
ON certification_documents FOR INSERT
TO authenticated
WITH CHECK (org_id = current_setting('request.jwt.claims.org_id'::text));

CREATE POLICY "Enable delete access for certification documents for admins"
ON certification_documents FOR DELETE
TO authenticated
USING (
  org_id = current_setting('request.jwt.claims.org_id'::text)
  AND current_setting('request.jwt.claims.org_role'::text) = 'org:admin'
);