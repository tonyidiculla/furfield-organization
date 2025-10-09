-- Check RLS policies on organizations table
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
AND tablename = 'organizations';

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'master_data' 
AND tablename = 'organizations';

-- Check user's privileges table association
SELECT * FROM master_data.user_privileges 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'tony@fusionduotech.com')
LIMIT 5;
