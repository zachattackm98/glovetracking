/*
  # Fix RLS policies for assets and certification documents

  1. Security Changes
    - Enable RLS on both tables
    - Create permissive policies for authenticated users
    - Drop existing policies to avoid conflicts
    
  2. Tables Modified
    - assets
    - certification_documents
*/

-- First ensure RLS is enabled
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "assets_read_policy" ON assets;
DROP POLICY IF EXISTS "assets_insert_policy" ON assets;
DROP POLICY IF EXISTS "assets_update_policy" ON assets;
DROP POLICY IF EXISTS "assets_delete_policy" ON assets;

-- Create new policies
CREATE POLICY "assets_read_policy"
ON assets
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "assets_insert_policy"
ON assets
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "assets_update_policy"
ON assets
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "assets_delete_policy"
ON assets
FOR DELETE
TO authenticated
USING (true);

-- Also update certification_documents table
ALTER TABLE certification_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "certification_documents_select_policy" ON certification_documents;
DROP POLICY IF EXISTS "certification_documents_insert_policy" ON certification_documents;
DROP POLICY IF EXISTS "certification_documents_delete_policy" ON certification_documents;

CREATE POLICY "certification_documents_select_policy"
ON certification_documents
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "certification_documents_insert_policy"
ON certification_documents
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "certification_documents_delete_policy"
ON certification_documents
FOR DELETE
TO authenticated
USING (true);