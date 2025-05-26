/*
  # Update RLS policies for assets table
  
  1. Changes
    - Drop existing policies
    - Create new policies with explicit type casting
    - Enforce organization-level access control
    - Set up role-based permissions for admins and members
*/

-- Drop all existing policies on the assets table
DO $$ 
BEGIN
  -- Get all policy names for the assets table
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'assets'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON assets', pol.policyname);
  END LOOP;
END $$;

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