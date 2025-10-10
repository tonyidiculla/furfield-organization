-- ULTIMATE SIMPLE FIX - Just disable RLS temporarily
-- This removes ALL restrictions on the organizations table

-- Option 1: Disable RLS entirely (easiest)
ALTER TABLE master_data.organizations DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'master_data'
AND tablename = 'organizations';

SELECT '⚠️ WARNING: RLS is now DISABLED on organizations table' as warning;
SELECT '⚠️ Any authenticated user can now update organizations' as warning;
SELECT '⚠️ Re-enable with: ALTER TABLE master_data.organizations ENABLE ROW LEVEL SECURITY;' as todo;
