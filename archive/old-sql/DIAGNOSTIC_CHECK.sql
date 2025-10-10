-- Quick diagnostic to check if you have the required permissions
-- Run this FIRST to verify your access before applying the RLS fix

-- 1. Check if you have a profile with user_platform_id
SELECT 
    '1. Your Profile' as check_name,
    user_id,
    user_platform_id,
    display_name,
    email
FROM master_data.profiles
WHERE user_id = auth.uid();

-- 2. Check your role assignments
SELECT 
    '2. Your Role Assignments' as check_name,
    ura.user_platform_id,
    ura.platform_role_id,
    ura.is_active,
    ura.expires_at
FROM master_data.user_to_role_assignment ura
WHERE ura.user_platform_id = (
    SELECT user_platform_id FROM master_data.profiles WHERE user_id = auth.uid()
);

-- 3. Check your role permissions
SELECT 
    '3. Your Role Permissions' as check_name,
    pr.id as role_id,
    pr.role_name,
    pr.privilege_level,
    pr.permissions,
    pr.modules,
    pr.is_active,
    CASE 
        WHEN pr.permissions::jsonb ? 'entity_configuration' OR pr.permissions::jsonb ? 'entity_administration'
        THEN '✅ Can Edit Organizations'
        ELSE '❌ Cannot Edit Organizations'
    END as can_edit_orgs
FROM master_data.profiles p
JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
WHERE p.user_id = auth.uid();

-- 4. Check if you can edit organizations
SELECT 
    '4. Can Edit Organizations?' as check_name,
    CASE 
        WHEN COUNT(*) > 0 THEN 'YES - You have edit access'
        ELSE 'NO - You need entity_configuration or entity_administration permission'
    END as result
FROM master_data.profiles p
JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
WHERE p.user_id = auth.uid()
AND ura.is_active = true
AND pr.is_active = true
AND (pr.permissions::jsonb ? 'entity_configuration' OR pr.permissions::jsonb ? 'entity_administration');

-- 5. List all tables in master_data schema (for reference)
SELECT 
    '5. Available Tables' as check_name,
    tablename
FROM pg_tables
WHERE schemaname = 'master_data'
ORDER BY tablename;
