-- Grant UPDATE permission on hospitals table to authenticated users
-- This is needed for the edit entity form to work

-- First, let's find which schema the hospitals table is in
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename = 'hospitals';

-- Grant UPDATE permission (try different schemas)
-- Option 1: If in master_data schema
GRANT UPDATE ON master_data.hospitals TO authenticated;
GRANT SELECT ON master_data.hospitals TO authenticated;

-- Option 2: If in public schema (uncomment if needed)
-- GRANT UPDATE ON public.hospitals TO authenticated;
-- GRANT SELECT ON public.hospitals TO authenticated;

-- Verify the grants
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'hospitals'
AND grantee = 'authenticated';
