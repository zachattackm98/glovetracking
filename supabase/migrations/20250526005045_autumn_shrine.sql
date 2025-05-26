/*
  # Update assets table assigned_user_id constraint

  1. Changes
    - Modify `assigned_user_id` column in `assets` table to allow NULL values
    - This change aligns the database schema with the application's data model
    - Assets can now exist without being assigned to a user

  2. Impact
    - Existing data is preserved
    - Application can now create assets without an assigned user
    - Maintains data integrity while providing more flexibility
*/

DO $$ 
BEGIN
  ALTER TABLE assets 
    ALTER COLUMN assigned_user_id DROP NOT NULL;
END $$;