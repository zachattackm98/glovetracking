-- Disable RLS on all tables
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE certification_documents DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON assets;
DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON assets;
DROP POLICY IF EXISTS "Enable update access for all authenticated users" ON assets;
DROP POLICY IF EXISTS "Enable delete access for all authenticated users" ON assets;

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON certification_documents;
DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON certification_documents;
DROP POLICY IF EXISTS "Enable delete access for all authenticated users" ON certification_documents;