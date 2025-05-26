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

-- Create simplified policies for assets with no JWT checks
CREATE POLICY "Enable read access for all authenticated users"
ON assets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for all authenticated users"
ON assets FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for all authenticated users"
ON assets FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Enable delete access for all authenticated users"
ON assets FOR DELETE
TO authenticated
USING (true);

-- Create simplified policies for certification documents with no JWT checks
CREATE POLICY "Enable read access for all authenticated users"
ON certification_documents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for all authenticated users"
ON certification_documents FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable delete access for all authenticated users"
ON certification_documents FOR DELETE
TO authenticated
USING (true);