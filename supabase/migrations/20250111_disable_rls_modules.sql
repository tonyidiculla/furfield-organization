-- Grant SELECT permission on modules table to match other master_data reference tables
-- This allows authenticated and anonymous users to read from the modules table

-- Grant SELECT permission to authenticated users
GRANT SELECT ON master_data.modules TO authenticated;

-- Grant SELECT permission to anonymous users (for public access)
GRANT SELECT ON master_data.modules TO anon;

-- Grant USAGE on schema (if not already granted)
GRANT USAGE ON SCHEMA master_data TO authenticated;
GRANT USAGE ON SCHEMA master_data TO anon;

-- Verify grants
SELECT 
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'master_data' 
  AND table_name = 'modules'
ORDER BY grantee, privilege_type;

-- Comment
COMMENT ON TABLE master_data.modules IS 
'HMS modules catalog with pricing. Read access granted to all users.';
