-- ============================================
-- Fix or recreate the is_org_admin() function
-- ============================================
CREATE OR REPLACE FUNCTION is_org_admin(user_id text, org_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_organizations
    WHERE user_organizations.user_id = is_org_admin.user_id
      AND user_organizations.org_id = is_org_admin.org_id
      AND user_organizations.role = 'org:admin'
  );
$$;

GRANT EXECUTE ON FUNCTION is_org_admin(text, text) TO anon, authenticated, service_role;

-- ============================================
-- RLS Policies for user_organizations
-- ============================================
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Admins can manage organization memberships" ON user_organizations;

CREATE POLICY "Users can view their own organization memberships"
  ON user_organizations FOR SELECT
  USING (
    user_id = auth.jwt() ->> 'user_id'
  );

CREATE POLICY "Admins can manage organization memberships"
  ON user_organizations FOR ALL
  USING (
    is_org_admin(auth.jwt() ->> 'user_id', org_id)
  );

-- ============================================
-- RLS Policies for assets table (using org_id)
-- ============================================
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view assets in their organization" ON assets;
DROP POLICY IF EXISTS "Admins can manage all assets in their organization" ON assets;
DROP POLICY IF EXISTS "Members can update their own assigned assets" ON assets;
DROP POLICY IF EXISTS "Users can insert assets in their organization" ON assets;

CREATE POLICY "Users can view assets in their organization"
  ON assets FOR SELECT
  USING (
    org_id = auth.jwt() ->> 'org_id'
  );

CREATE POLICY "Admins can manage all assets in their organization"
  ON assets FOR ALL
  USING (
    org_id = auth.jwt() ->> 'org_id'
    AND auth.jwt() ->> 'org_role' = 'org:admin'
  );

CREATE POLICY "Members can update their own assigned assets"
  ON assets FOR UPDATE
  USING (
    assigned_user_id = auth.jwt() ->> 'user_id'
    AND org_id = auth.jwt() ->> 'org_id'
    AND auth.jwt() ->> 'org_role' = 'org:member'
  );

CREATE POLICY "Users can insert assets in their organization"
  ON assets FOR INSERT
  WITH CHECK (
    org_id = auth.jwt() ->> 'org_id'
    AND (
      auth.jwt() ->> 'org_role' = 'org:admin'
      OR auth.jwt() ->> 'org_role' = 'org:member'
    )
  );

-- ============================================
-- Permissive Storage Policy for Public Uploads
-- ============================================
CREATE POLICY "Allow all inserts to certificationdocuments"
  ON storage.objects
  FOR INSERT
  USING (true); 