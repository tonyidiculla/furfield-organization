-- ============================================================================
-- Grant Access to master_data Schema
-- ============================================================================
-- This script grants necessary permissions to access master_data schema
-- through Supabase PostgREST API
-- ============================================================================

-- Grant USAGE on master_data schema to Supabase roles
GRANT USAGE ON SCHEMA master_data TO anon, authenticated, service_role;

-- Grant SELECT permissions on all tables in master_data
GRANT SELECT ON ALL TABLES IN SCHEMA master_data TO anon, authenticated, service_role;

-- Grant SELECT on specific tables (explicit for clarity)
GRANT SELECT ON master_data.platform_roles TO anon, authenticated, service_role;
GRANT SELECT ON master_data.user_to_role_assignment TO anon, authenticated, service_role;

-- If you want to allow INSERT/UPDATE/DELETE for authenticated users
-- Uncomment the following lines:
-- GRANT INSERT, UPDATE, DELETE ON master_data.user_to_role_assignment TO authenticated, service_role;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA master_data 
GRANT SELECT ON TABLES TO anon, authenticated, service_role;

-- Add master_data to the search path for PostgREST
ALTER ROLE anon SET search_path TO public, master_data;
ALTER ROLE authenticated SET search_path TO public, master_data;

-- Reload PostgREST configuration
NOTIFY pgrst, 'reload config';

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this after applying the above to verify:
-- 
-- SELECT 
--   schemaname,
--   tablename,
--   array_agg(privilege_type) as privileges
-- FROM information_schema.table_privileges
-- WHERE grantee IN ('anon', 'authenticated', 'service_role')
--   AND schemaname = 'master_data'
-- GROUP BY schemaname, tablename
-- ORDER BY tablename;
-- ============================================================================
