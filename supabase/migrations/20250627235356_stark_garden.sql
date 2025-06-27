/*
  # Debug RLS JWT Issues

  This migration adds debugging capabilities to understand why RLS policies are failing.
  It creates helper functions to inspect JWT claims and adds comprehensive logging.

  ## Changes Made:
  1. Create debugging functions to inspect JWT claims
  2. Add temporary policies with detailed logging
  3. Create test functions to verify JWT structure
  4. Add debugging views for troubleshooting
*/

-- Create a function to debug JWT claims
CREATE OR REPLACE FUNCTION debug_jwt_claims()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.jwt();
$$;

-- Create a function to get specific JWT claim with debugging
CREATE OR REPLACE FUNCTION get_jwt_claim(claim_name text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    auth.jwt() ->> claim_name,
    'CLAIM_NOT_FOUND'
  );
$$;

-- Create a function to log RLS policy checks
CREATE OR REPLACE FUNCTION log_rls_check(
  table_name text,
  operation text,
  org_id_from_jwt text,
  org_role_from_jwt text,
  user_id_from_jwt text,
  record_org_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log the RLS check details
  RAISE NOTICE 'RLS Check - Table: %, Operation: %, JWT org_id: %, JWT org_role: %, JWT user_id: %, Record org_id: %',
    table_name, operation, org_id_from_jwt, org_role_from_jwt, user_id_from_jwt, record_org_id;
  
  RETURN true;
END;
$$;

-- Drop existing policies to recreate with debugging
DROP POLICY IF EXISTS "Users can view assets based on role and assignment" ON assets;
DROP POLICY IF EXISTS "Users can insert assets in their organization" ON assets;
DROP POLICY IF EXISTS "Users can update assets based on role and assignment" ON assets;
DROP POLICY IF EXISTS "Admins can delete assets in their organization" ON assets;

-- Create new assets policies with debugging
CREATE POLICY "Users can view assets based on role and assignment"
  ON assets
  FOR SELECT
  TO authenticated
  USING (
    log_rls_check(
      'assets',
      'SELECT',
      auth.jwt() ->> 'org_id',
      auth.jwt() ->> 'org_role',
      auth.jwt() ->> 'user_id',
      org_id
    ) AND
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
    log_rls_check(
      'assets',
      'INSERT',
      auth.jwt() ->> 'org_id',
      auth.jwt() ->> 'org_role',
      auth.jwt() ->> 'user_id',
      org_id
    ) AND
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
    log_rls_check(
      'assets',
      'UPDATE_USING',
      auth.jwt() ->> 'org_id',
      auth.jwt() ->> 'org_role',
      auth.jwt() ->> 'user_id',
      org_id
    ) AND
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
    log_rls_check(
      'assets',
      'UPDATE_CHECK',
      auth.jwt() ->> 'org_id',
      auth.jwt() ->> 'org_role',
      auth.jwt() ->> 'user_id',
      org_id
    ) AND
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
    log_rls_check(
      'assets',
      'DELETE',
      auth.jwt() ->> 'org_id',
      auth.jwt() ->> 'org_role',
      auth.jwt() ->> 'user_id',
      org_id
    ) AND
    org_id = (auth.jwt() ->> 'org_id') AND
    (auth.jwt() ->> 'org_role') = 'org:admin'
  );

-- Keep service role policy unchanged
CREATE POLICY "Service role can manage all assets"
  ON assets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a view to help debug JWT claims
CREATE OR REPLACE VIEW debug_current_user AS
SELECT 
  auth.uid() as user_id,
  auth.jwt() as full_jwt,
  auth.jwt() ->> 'org_id' as org_id_claim,
  auth.jwt() ->> 'org_role' as org_role_claim,
  auth.jwt() ->> 'user_id' as user_id_claim,
  auth.jwt() ->> 'email' as email_claim,
  auth.role() as current_role;

-- Grant access to the debug view
GRANT SELECT ON debug_current_user TO authenticated;
GRANT SELECT ON debug_current_user TO anon;