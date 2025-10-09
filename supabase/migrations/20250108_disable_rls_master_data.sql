-- Check and disable RLS on master_data tables for testing
-- This allows authenticated users to read from these tables

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'master_data';

-- Disable RLS on user_to_role_assignment
ALTER TABLE master_data.user_to_role_assignment DISABLE ROW LEVEL SECURITY;

-- Disable RLS on platform_roles  
ALTER TABLE master_data.platform_roles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on profiles
ALTER TABLE master_data.profiles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'master_data';
