-- Verify and ensure UPDATE permissions on master_data.profiles
-- Run this to check if the issue is permissions

-- Check current policies on profiles table
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'master_data' AND tablename = 'profiles';

-- If no policies exist or they're too restrictive, disable RLS temporarily for testing
-- (You can re-enable later with proper policies)
ALTER TABLE master_data.profiles DISABLE ROW LEVEL SECURITY;

-- Ensure permissions are granted
GRANT SELECT, INSERT, UPDATE ON master_data.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON master_data.profiles TO service_role;
