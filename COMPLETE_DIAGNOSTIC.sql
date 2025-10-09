-- COMPLETE DIAGNOSTIC - Run this first to understand the issue
-- Copy all of this and run in Supabase SQL Editor

-- ============================================
-- PART 1: Check if you have a profile
-- ============================================
SELECT '=== 1. Your Profile ===' as section;
SELECT 
    user_id,
    user_platform_id,
    email
FROM master_data.profiles
WHERE user_id = auth.uid();

-- ============================================
-- PART 2: Check if you have any role assignments
-- ============================================
SELECT '=== 2. Your Role Assignments ===' as section;
SELECT 
    id,
    user_platform_id,
    platform_role_id,
    is_active,
    expires_at,
    assigned_at
FROM master_data.user_to_role_assignment
WHERE user_platform_id = (SELECT user_platform_id FROM master_data.profiles WHERE user_id = auth.uid());

-- ============================================
-- PART 3: Check your role details
-- ============================================
SELECT '=== 3. Your Role Details ===' as section;
SELECT 
    pr.id,
    pr.role_name,
    pr.privilege_level,
    pr.permissions,
    pr.modules,
    pr.is_active
FROM master_data.profiles p
JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
WHERE p.user_id = auth.uid();

-- ============================================
-- PART 4: Check current RLS policies
-- ============================================
SELECT '=== 4. Current RLS Policies ===' as section;
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies
WHERE schemaname = 'master_data'
AND tablename = 'organizations'
ORDER BY cmd, policyname;

-- ============================================
-- PART 5: Test if the policy logic would pass
-- ============================================
SELECT '=== 5. Policy Logic Test ===' as section;
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ YES - Policy should allow UPDATE'
        ELSE '❌ NO - Policy will block UPDATE (this is the problem!)'
    END as policy_check_result,
    COUNT(*) as matching_roles
FROM master_data.profiles p
JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
WHERE p.user_id = auth.uid()
AND ura.is_active = true
AND pr.is_active = true
AND (
    pr.permissions::jsonb ? 'entity_configuration'
    OR pr.permissions::jsonb ? 'entity_administration'
);

-- ============================================
-- PART 6: If no roles, check what you need
-- ============================================
SELECT '=== 6. Available Roles with Required Permissions ===' as section;
SELECT 
    id,
    role_name,
    privilege_level,
    permissions
FROM master_data.platform_roles
WHERE is_active = true
AND (
    permissions::jsonb ? 'entity_configuration'
    OR permissions::jsonb ? 'entity_administration'
)
ORDER BY privilege_level
LIMIT 5;
