-- Enable RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for users in same org" ON assets;
DROP POLICY IF EXISTS "Enable insert access for users in same org" ON assets;
DROP POLICY IF EXISTS "Enable update access for admins and assigned users" ON assets;
DROP POLICY IF EXISTS "Enable delete access for admins" ON assets;

DROP POLICY IF EXISTS "Enable read access for certification documents in same org" ON certification_documents;
DROP POLICY IF EXISTS "Enable insert access for certification documents in same org" ON certification_documents;
DROP POLICY IF EXISTS "Enable delete access for certification documents for admins" ON certification_documents;

-- Create new policies for assets
CREATE POLICY "Enable read access for users in same org"
ON assets FOR SELECT
TO authenticated
USING (
  org_id = ANY (ARRAY[
    current_setting('request.jwt.claims.org_id'::text, true),
    current_setting('request.jwt.claims.organization_id'::text, true)
  ])
);

CREATE POLICY "Enable insert access for users in same org"
ON assets FOR INSERT
TO authenticated
WITH CHECK (
  org_id = ANY (ARRAY[
    current_setting('request.jwt.claims.org_id'::text, true),
    current_setting('request.jwt.claims.organization_id'::text, true)
  ])
);

CREATE POLICY "Enable update access for admins and assigned users"
ON assets FOR UPDATE
TO authenticated
USING (
  org_id = ANY (ARRAY[
    current_setting('request.jwt.claims.org_id'::text, true),
    current_setting('request.jwt.claims.organization_id'::text, true)
  ])
  AND (
    current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'
    OR assigned_user_id = current_setting('request.jwt.claims.sub'::text, true)
  )
)
WITH CHECK (
  org_id = ANY (ARRAY[
    current_setting('request.jwt.claims.org_id'::text, true),
    current_setting('request.jwt.claims.organization_id'::text, true)
  ])
  AND (
    current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'
    OR assigned_user_id = current_setting('request.jwt.claims.sub'::text, true)
  )
);

CREATE POLICY "Enable delete access for admins"
ON assets FOR DELETE
TO authenticated
USING (
  org_id = ANY (ARRAY[
    current_setting('request.jwt.claims.org_id'::text, true),
    current_setting('request.jwt.claims.organization_id'::text, true)
  ])
  AND current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'
);

-- Create new policies for certification documents
CREATE POLICY "Enable read access for certification documents in same org"
ON certification_documents FOR SELECT
TO authenticated
USING (
  org_id = ANY (ARRAY[
    current_setting('request.jwt.claims.org_id'::text, true),
    current_setting('request.jwt.claims.organization_id'::text, true)
  ])
);

CREATE POLICY "Enable insert access for certification documents in same org"
ON certification_documents FOR INSERT
TO authenticated
WITH CHECK (
  org_id = ANY (ARRAY[
    current_setting('request.jwt.claims.org_id'::text, true),
    current_setting('request.jwt.claims.organization_id'::text, true)
  ])
);

CREATE POLICY "Enable delete access for certification documents for admins"
ON certification_documents FOR DELETE
TO authenticated
USING (
  org_id = ANY (ARRAY[
    current_setting('request.jwt.claims.org_id'::text, true),
    current_setting('request.jwt.claims.organization_id'::text, true)
  ])
  AND current_setting('request.jwt.claims.org_role'::text, true) = 'org:admin'
);