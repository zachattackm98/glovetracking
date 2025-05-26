-- USER ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS user_organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    org_id TEXT NOT NULL,
    org_role TEXT NOT NULL DEFAULT 'org:member',
    org_slug TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, org_id)
);

ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Admins can manage organization memberships" ON user_organizations;

CREATE POLICY "Users can view their own organization memberships"
    ON user_organizations FOR SELECT
    USING (user_id = auth.jwt() ->> 'user_id');

CREATE POLICY "Admins can manage organization memberships"
    ON user_organizations FOR ALL
    USING (
        user_id = auth.jwt() ->> 'user_id'
        OR (
            org_id = auth.jwt() ->> 'org_id'
            AND org_role = 'org:admin'
        )
    );

CREATE INDEX IF NOT EXISTS idx_user_org_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_org_org_id ON user_organizations(org_id);

-- ASSETS TABLE
CREATE TABLE IF NOT EXISTS assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    serial_number TEXT NOT NULL,
    asset_class TEXT NOT NULL,
    assigned_user_id TEXT,
    issue_date DATE,
    last_certification_date DATE,
    next_certification_date DATE,
    status TEXT NOT NULL,
    org_id TEXT NOT NULL,
    glove_size TEXT,
    glove_color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view assets in their organization" ON assets;
DROP POLICY IF EXISTS "Admins can manage all assets in their organization" ON assets;
DROP POLICY IF EXISTS "Members can manage their own assets" ON assets;
DROP POLICY IF EXISTS "Users can insert assets in their organization" ON assets;

CREATE POLICY "Users can view assets in their organization"
    ON assets FOR SELECT
    USING (
        org_id = auth.jwt() ->> 'org_id'
        OR assigned_user_id = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "Admins can manage all assets in their organization"
    ON assets FOR UPDATE USING (
        org_id = auth.jwt() ->> 'org_id'
        AND auth.jwt() ->> 'org_role' = 'org:admin'
    );

CREATE POLICY "Members can manage their own assets"
    ON assets FOR UPDATE USING (
        assigned_user_id = auth.jwt() ->> 'user_id'
        AND org_id = auth.jwt() ->> 'org_id'
        AND auth.jwt() ->> 'org_role' = 'org:member'
    );

CREATE POLICY "Users can insert assets in their organization"
    ON assets FOR INSERT WITH CHECK (
        org_id = auth.jwt() ->> 'org_id'
        AND (
            auth.jwt() ->> 'org_role' = 'org:admin'
            OR auth.jwt() ->> 'org_role' = 'org:member'
        )
    );

CREATE INDEX IF NOT EXISTS idx_assets_org_id ON assets(org_id);
CREATE INDEX IF NOT EXISTS idx_assets_assigned_user_id ON assets(assigned_user_id);

-- CERTIFICATION DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS certification_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    uploaded_by TEXT NOT NULL,
    org_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

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
    ON certification_documents FOR UPDATE USING (
        org_id = auth.jwt() ->> 'org_id'
        AND auth.jwt() ->> 'org_role' = 'org:admin'
    );

CREATE POLICY "Users can insert certification documents in their organization"
    ON certification_documents FOR INSERT WITH CHECK (
        org_id = auth.jwt() ->> 'org_id'
        AND (
            auth.jwt() ->> 'org_role' = 'org:admin'
            OR auth.jwt() ->> 'org_role' = 'org:member'
        )
    );

CREATE INDEX IF NOT EXISTS idx_cert_docs_org_id ON certification_documents(org_id);
CREATE INDEX IF NOT EXISTS idx_cert_docs_asset_id ON certification_documents(asset_id);

-- OPTIONAL: SAMPLE INSERT
-- INSERT INTO user_organizations (user_id, org_id, role) VALUES ('your_clerk_user_id', 'your_clerk_org_id', 'org:admin')
-- ON CONFLICT (user_id, org_id) DO NOTHING; 