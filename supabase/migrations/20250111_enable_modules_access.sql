-- Enable read access to modules table for authenticated users
-- The modules table has RLS enabled but no policies, causing all queries to return 0 rows

-- Check current RLS status (for reference)
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'master_data' AND tablename = 'modules';

-- Option 1: Create RLS policy to allow all authenticated users to read modules
CREATE POLICY "Allow authenticated users to read modules"
ON master_data.modules
FOR SELECT
TO authenticated
USING (true);

-- Option 2: If you want public read access (uncomment if needed)
-- CREATE POLICY "Allow public read access to modules"
-- ON master_data.modules
-- FOR SELECT
-- TO public
-- USING (true);

-- Grant SELECT permission to authenticated role (if not already granted)
GRANT SELECT ON master_data.modules TO authenticated;

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'master_data' 
AND tablename = 'modules';
