-- Check RLS policies on hospitals table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'master_data' 
  AND tablename = 'hospitals';
