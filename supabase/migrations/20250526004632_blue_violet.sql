/*
  # Update RLS policies for assets table
  
  This migration updates the Row Level Security (RLS) policies for the assets table
  to ensure proper access control based on organization membership and roles.
  
  1. Changes
    - Drops existing policies to avoid conflicts
    - Creates new policies for CRUD operations with proper type casting
    - Ensures organization-based access control
    - Implements role-based permissions for admins
  
  2. Security
    - Enforces organization boundaries
    - Restricts delete operations to admins
    - Allows users to manage their assigned assets
    - Ensures proper type casting for all comparisons
*/

-- Drop all existing policies to ensure clean slate
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'assets'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON assets', policy_record.policyname);
    END LOOP;
END
$$;

-- Create new policies with explicit type casting and clear naming
CREATE POLICY "assets_read_policy"
ON assets
FOR SELECT
TO authenticated
USING (
  org_id::text = (auth.jwt() ->> 'org_id')::text
);

CREATE POLICY "assets_insert_policy"
ON assets
FOR INSERT
TO authenticated
WITH CHECK (
  org_id::text = (auth.jwt() ->> 'org_id')::text
);

CREATE POLICY "assets_update_policy"
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

CREATE POLICY "assets_delete_policy"
ON assets
FOR DELETE
TO authenticated
USING (
  org_id::text = (auth.jwt() ->> 'org_id')::text
  AND (auth.jwt() ->> 'org_role')::text = 'org:admin'
);