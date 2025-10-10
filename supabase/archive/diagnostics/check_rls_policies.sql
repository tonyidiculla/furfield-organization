-- Check ALL policies on hospitals table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'master_data' 
  AND tablename = 'hospitals';

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'master_data' 
  AND tablename = 'hospitals';

-- Check for any custom functions in master_data schema
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    p.prokind as function_kind
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'master_data'
  AND p.prokind IN ('f', 't')  -- Regular functions and trigger functions only
ORDER BY p.proname;
