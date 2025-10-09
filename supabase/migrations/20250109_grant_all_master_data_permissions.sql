-- Complete permissions grant for all master_data tables
-- This ensures authenticated users have the base permissions
-- RLS policies will control which specific rows they can access

-- Grant permissions on profiles table
GRANT SELECT, INSERT, UPDATE, DELETE ON master_data.profiles TO authenticated;

-- Grant permissions on platform_roles table (read-only for regular users)
GRANT SELECT ON master_data.platform_roles TO authenticated;

-- Grant permissions on user_to_role_assignment table
GRANT SELECT, INSERT, UPDATE, DELETE ON master_data.user_to_role_assignment TO authenticated;

-- Grant permissions on organizations table
GRANT SELECT, INSERT, UPDATE, DELETE ON master_data.organizations TO authenticated;

-- Grant permissions on location_currency table (read-only for regular users)
GRANT SELECT ON master_data.location_currency TO authenticated;
GRANT INSERT, UPDATE, DELETE ON master_data.location_currency TO authenticated;

-- Grant USAGE on the master_data schema
GRANT USAGE ON SCHEMA master_data TO authenticated;

-- Verify all grants
SELECT 
    table_name,
    STRING_AGG(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.table_privileges
WHERE table_schema = 'master_data'
AND grantee = 'authenticated'
GROUP BY table_name
ORDER BY table_name;
