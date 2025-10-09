-- Check what tables exist in master_data schema
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'master_data'
ORDER BY tablename;

-- Check for any privilege/permission related tables
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE tablename LIKE '%privil%' 
   OR tablename LIKE '%permission%'
   OR tablename LIKE '%access%'
   OR tablename LIKE '%role%'
ORDER BY schemaname, tablename;
