/*
  # Disable RLS for certification documents bucket
  
  1. Changes
    - Disable RLS on certification_documents table
    - Drop all existing policies
*/

-- Disable RLS on certification_documents table
ALTER TABLE certification_documents DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON certification_documents;
DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON certification_documents;
DROP POLICY IF EXISTS "Enable delete access for all authenticated users" ON certification_documents;