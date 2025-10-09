-- Check the actual structure of user_to_role_assignment table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'master_data'
AND table_name = 'user_to_role_assignment'
ORDER BY ordinal_position;

-- Also check platform_roles structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'master_data'
AND table_name = 'platform_roles'
ORDER BY ordinal_position;

-- Check profiles structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'master_data'
AND table_name = 'profiles'
ORDER BY ordinal_position;
