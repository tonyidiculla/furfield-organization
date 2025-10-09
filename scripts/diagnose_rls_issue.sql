-- Diagnostic: Check why UPDATE is failing
-- Run this to understand the RLS issue

-- 1. Check if user has any privileges
SELECT 
    'User Privileges Check' as section,
    COUNT(*) as privilege_count
FROM master_data.user_privileges 
WHERE user_id = auth.uid();

-- 2. Check specific privileges for the organization
SELECT 
    'Organization Privileges' as section,
    up.*,
    o.organization_name
FROM master_data.user_privileges up
LEFT JOIN master_data.organizations o ON up.organization_id = o.organization_id
WHERE up.user_id = auth.uid()
AND up.organization_id = '639e9d01-756f-4776-80ed-075e5cedefb6'; -- Fusionduo Technologies LLP

-- 3. Check all organizations user has access to
SELECT 
    'All Accessible Organizations' as section,
    o.organization_id,
    o.organization_name,
    up.access_entity_configuration,
    up.access_entity_administration,
    up.is_active
FROM master_data.organizations o
JOIN master_data.user_privileges up ON o.organization_id = up.organization_id
WHERE up.user_id = auth.uid();

-- 4. Check RLS policies
SELECT 
    'Current RLS Policies' as section,
    tablename,
    policyname,
    cmd,
    permissive,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause' 
        ELSE 'No USING clause' 
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause' 
        ELSE 'No WITH CHECK clause' 
    END as with_check_clause
FROM pg_policies 
WHERE schemaname = 'master_data' 
AND tablename = 'organizations'
ORDER BY cmd, policyname;

-- 5. Test if user can see the organization (SELECT works)
SELECT 
    'Can SELECT Organization' as section,
    organization_id,
    organization_name,
    is_active
FROM master_data.organizations
WHERE organization_id = '639e9d01-756f-4776-80ed-075e5cedefb6';
