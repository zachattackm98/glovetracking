-- ============================================
-- Helper Function: is_org_admin
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
-- RLS Policies for certification_documents table
-- ============================================
ALTER TABLE certification_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view certification documents in their organization" ON certification_documents;
DROP POLICY IF EXISTS "Admins can manage all certification documents in their organization" ON certification_documents;
DROP POLICY IF EXISTS "Users can insert certification documents in their organization" ON certification_documents;

CREATE POLICY "Users can view certification documents in their organization"
  ON certification_documents FOR SELECT
  USING (
    org_id = auth.jwt() ->> 'org_id'
  );

CREATE POLICY "Admins can manage all certification documents in their organization"
  ON certification_documents FOR ALL
  USING (
    org_id = auth.jwt() ->> 'org_id'
    AND auth.jwt() ->> 'org_role' = 'org:admin'
  );

CREATE POLICY "Users can insert certification documents in their organization"
  ON certification_documents FOR INSERT
  WITH CHECK (
    org_id = auth.jwt() ->> 'org_id'
    AND (
      auth.jwt() ->> 'org_role' = 'org:admin'
      OR auth.jwt() ->> 'org_role' = 'org:member'
    )
  );

-- ============================================
-- Supabase Storage RLS Policies for certificationdocuments bucket
-- ============================================
-- Allow authenticated users to upload files to the certificationdocuments bucket
CREATE POLICY "Authenticated users can upload to certificationdocuments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  USING (
    bucket_id = 'certificationdocuments'
  );

-- Allow authenticated users to read files from the certificationdocuments bucket
CREATE POLICY "Authenticated users can read from certificationdocuments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'certificationdocuments'
  );

-- (Optional) Allow authenticated users to update/delete their own uploads
CREATE POLICY "Authenticated users can update their own uploads in certificationdocuments"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'certificationdocuments'
    AND auth.uid() = owner
  );

CREATE POLICY "Authenticated users can delete their own uploads in certificationdocuments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'certificationdocuments'
    AND auth.uid() = owner
  ); 