/*
  # Initial assets schema setup

  1. New Tables
    - `assets`
      - `id` (uuid, primary key)
      - `org_id` (text, required) - Organization ID
      - `serial_number` (text, required) - Unique identifier for the asset
      - `asset_class` (text, required) - Class type (0, 00, 1, 2, 3, 4)
      - `glove_size` (text, nullable) - Size of the glove
      - `glove_color` (text, nullable) - Color of the glove
      - `issue_date` (date, required) - Date when asset was issued
      - `last_certification_date` (date, required) - Date of last certification
      - `next_certification_date` (date, required) - Date when next certification is due
      - `status` (text, required) - Current status (active, near-due, expired, failed, in-testing)
      - `failure_date` (date, nullable) - Date when asset failed, if applicable
      - `failure_reason` (text, nullable) - Reason for failure, if applicable
      - `testing_start_date` (date, nullable) - Date when testing began, if applicable
      - `assigned_user_id` (text, nullable) - ID of assigned user
      - `created_at` (timestamptz, default: now())

    - `certification_documents`
      - `id` (uuid, primary key)
      - `asset_id` (uuid, required, references assets.id)
      - `file_name` (text, required)
      - `file_url` (text, required)
      - `upload_date` (timestamptz, default: now())
      - `uploaded_by` (text, required)
      - `org_id` (text, required)

  2. Security
    - Enable RLS on both tables
    - Add policies for organization-based access
    - Add policies for user-based access
*/

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  serial_number text NOT NULL,
  asset_class text NOT NULL,
  glove_size text,
  glove_color text,
  issue_date date NOT NULL,
  last_certification_date date NOT NULL,
  next_certification_date date NOT NULL,
  status text NOT NULL,
  failure_date date,
  failure_reason text,
  testing_start_date date,
  assigned_user_id text,
  created_at timestamptz DEFAULT now(),

  -- Add constraints
  CONSTRAINT valid_asset_class CHECK (asset_class = ANY(ARRAY['Class 0', 'Class 00', 'Class 1', 'Class 2', 'Class 3', 'Class 4'])),
  CONSTRAINT valid_glove_size CHECK (glove_size IS NULL OR glove_size = ANY(ARRAY['7', '8', '9', '10', '11', '12'])),
  CONSTRAINT valid_glove_color CHECK (glove_color IS NULL OR glove_color = ANY(ARRAY['red', 'yellow', 'black', 'beige'])),
  CONSTRAINT valid_status CHECK (status = ANY(ARRAY['active', 'near-due', 'expired', 'in-testing', 'failed']))
);

-- Create certification_documents table
CREATE TABLE IF NOT EXISTS certification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  upload_date timestamptz DEFAULT now(),
  uploaded_by text NOT NULL,
  org_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_documents ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assets_org_id ON assets(org_id);
CREATE INDEX IF NOT EXISTS idx_assets_assigned_user_id ON assets(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_certification_documents_asset_id ON certification_documents(asset_id);
CREATE INDEX IF NOT EXISTS idx_certification_documents_org_id ON certification_documents(org_id);

-- RLS Policies for assets

-- Allow users to view assets in their organization
CREATE POLICY "Users can view assets in their organization"
  ON assets
  FOR SELECT
  TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id'));

-- Allow admins to manage all assets in their organization
CREATE POLICY "Admins can manage all assets in their organization"
  ON assets
  FOR ALL
  TO authenticated
  USING (
    org_id = (auth.jwt() ->> 'org_id') AND
    (auth.jwt() ->> 'org_role') = 'org:admin'
  );

-- Allow members to view their assigned assets
CREATE POLICY "Members can view their assigned assets"
  ON assets
  FOR SELECT
  TO authenticated
  USING (
    org_id = (auth.jwt() ->> 'org_id') AND
    (
      assigned_user_id = auth.uid() OR
      (auth.jwt() ->> 'org_role') = 'org:admin'
    )
  );

-- RLS Policies for certification_documents

-- Allow users to view documents in their organization
CREATE POLICY "Users can view certification documents in their organization"
  ON certification_documents
  FOR SELECT
  TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id'));

-- Allow admins to manage documents in their organization
CREATE POLICY "Admins can manage certification documents"
  ON certification_documents
  FOR ALL
  TO authenticated
  USING (
    org_id = (auth.jwt() ->> 'org_id') AND
    (auth.jwt() ->> 'org_role') = 'org:admin'
  );