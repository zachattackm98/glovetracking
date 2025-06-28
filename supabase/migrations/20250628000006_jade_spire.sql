/*
  # Fix debug_current_user view for Clerk authentication

  1. Changes
    - Update debug_current_user view to handle Clerk user IDs as text instead of UUID
    - Remove problematic auth.uid() call that expects UUID format
    - Use only JWT claims for debugging

  2. Security
    - Maintain proper access controls
    - Keep debugging functionality for troubleshooting
*/

-- Drop the existing view
DROP VIEW IF EXISTS debug_current_user;

-- Create updated debug view that works with Clerk authentication
CREATE OR REPLACE VIEW debug_current_user AS
SELECT 
  auth.jwt() ->> 'user_id' as user_id_claim,
  auth.jwt() as full_jwt,
  auth.jwt() ->> 'org_id' as org_id_claim,
  auth.jwt() ->> 'org_role' as org_role_claim,
  auth.jwt() ->> 'email' as email_claim,
  auth.role() as current_role,
  CASE 
    WHEN auth.jwt() ->> 'org_id' = '{{organization.id}}' THEN 'PLACEHOLDER_DETECTED'
    WHEN auth.jwt() ->> 'org_role' = 'org.{{organization.role}}' THEN 'PLACEHOLDER_DETECTED'
    ELSE 'OK'
  END as jwt_template_status;

-- Grant access to the debug view
GRANT SELECT ON debug_current_user TO authenticated;
GRANT SELECT ON debug_current_user TO anon;

-- Create a function to validate JWT claims
CREATE OR REPLACE FUNCTION validate_jwt_claims()
RETURNS TABLE(
  is_valid boolean,
  org_id text,
  org_role text,
  user_id text,
  issues text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  jwt_claims jsonb;
  validation_issues text[] := '{}';
BEGIN
  -- Get JWT claims
  jwt_claims := auth.jwt();
  
  -- Check if JWT exists
  IF jwt_claims IS NULL THEN
    validation_issues := array_append(validation_issues, 'No JWT token found');
    RETURN QUERY SELECT false, null::text, null::text, null::text, validation_issues;
    RETURN;
  END IF;
  
  -- Extract claims
  org_id := jwt_claims ->> 'org_id';
  org_role := jwt_claims ->> 'org_role';
  user_id := jwt_claims ->> 'user_id';
  
  -- Validate org_id
  IF org_id IS NULL OR org_id = '' THEN
    validation_issues := array_append(validation_issues, 'Missing org_id claim');
  ELSIF org_id = '{{organization.id}}' THEN
    validation_issues := array_append(validation_issues, 'org_id contains placeholder value - check Clerk JWT template');
  END IF;
  
  -- Validate org_role
  IF org_role IS NULL OR org_role = '' THEN
    validation_issues := array_append(validation_issues, 'Missing org_role claim');
  ELSIF org_role = 'org.{{organization.role}}' THEN
    validation_issues := array_append(validation_issues, 'org_role contains placeholder value - check Clerk JWT template');
  ELSIF org_role NOT IN ('org:admin', 'org:member') THEN
    validation_issues := array_append(validation_issues, 'Invalid org_role value: ' || org_role);
  END IF;
  
  -- Validate user_id
  IF user_id IS NULL OR user_id = '' THEN
    validation_issues := array_append(validation_issues, 'Missing user_id claim');
  END IF;
  
  -- Return validation result
  is_valid := array_length(validation_issues, 1) IS NULL;
  
  RETURN QUERY SELECT is_valid, org_id, org_role, user_id, validation_issues;
END;
$$;

-- Grant access to the validation function
GRANT EXECUTE ON FUNCTION validate_jwt_claims() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_jwt_claims() TO anon;