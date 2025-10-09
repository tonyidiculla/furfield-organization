-- Grant UPDATE permission on organizations table to authenticated users
-- The RLS policy controls WHICH rows can be updated
-- But first we need to grant the base permission to UPDATE the table

-- Grant SELECT, INSERT, UPDATE, DELETE on organizations table
GRANT SELECT, INSERT, UPDATE, DELETE ON master_data.organizations TO authenticated;

-- Grant USAGE on the schema (if not already granted)
GRANT USAGE ON SCHEMA master_data TO authenticated;

-- Verify the grants
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'master_data'
AND table_name = 'organizations'
AND grantee = 'authenticated';
