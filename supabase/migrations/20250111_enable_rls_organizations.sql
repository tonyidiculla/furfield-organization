-- Enable RLS on Organizations Table
-- Date: October 10, 2025
-- This activates the existing RLS policies that control access to organizations

-- Enable RLS on organizations table
ALTER TABLE master_data.organizations ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'master_data' 
  AND tablename = 'organizations';

-- Verify policies are in place
SELECT 
    policyname, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'master_data' 
  AND tablename = 'organizations'
ORDER BY cmd;

-- Expected policies:
-- 1. organizations_select_policy (SELECT) - View organizations with role assignments
-- 2. organizations_insert_policy (INSERT) - Create with entity_configuration or entity_administration
-- 3. organizations_update_policy (UPDATE) - Update with entity_configuration or entity_administration
-- 4. organizations_delete_policy (DELETE) - Delete with entity_administration only

COMMENT ON TABLE master_data.organizations IS 
'Organizations table with RLS enabled. Access controlled by user role assignments and privileges.';
