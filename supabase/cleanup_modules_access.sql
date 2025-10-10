-- Cleanup Script: Remove unused modules functions and policies
-- Run this in Supabase SQL Editor
-- Date: October 10, 2025

-- 1. Drop the RPC function (no longer needed with GRANT approach)
DROP FUNCTION IF EXISTS public.get_hms_modules();

-- 2. Drop the RLS policy (using GRANT permissions instead)
DROP POLICY IF EXISTS "modules_select_policy" ON master_data.modules;

-- 3. Grant proper SELECT permissions to all users
GRANT SELECT ON master_data.modules TO authenticated;
GRANT SELECT ON master_data.modules TO anon;

-- 4. Grant USAGE on schema (if not already granted)
GRANT USAGE ON SCHEMA master_data TO authenticated;
GRANT USAGE ON SCHEMA master_data TO anon;

-- 5. Verify the grants
SELECT 
    grantee,
    privilege_type,
    table_name
FROM information_schema.table_privileges
WHERE table_schema = 'master_data' 
  AND table_name = 'modules'
ORDER BY grantee, privilege_type;

-- 6. Verify RLS status (should still be enabled, but with GRANT permissions)
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'master_data' 
  AND tablename = 'modules';

-- Expected result: 
-- - rowsecurity = true (RLS enabled)
-- - GRANTs allow SELECT for authenticated and anon
-- - This matches the pattern of other master_data reference tables
