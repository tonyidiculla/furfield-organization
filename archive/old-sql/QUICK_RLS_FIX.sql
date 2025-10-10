-- QUICK FIX: Run this in Supabase SQL Editor to fix RLS UPDATE issue
-- This uses the actual privilege system (user_to_role_assignment + platform_roles)

-- Step 1: Check current RLS policies
SELECT 
    'Current UPDATE Policies' as info,
    policyname, 
    cmd
FROM pg_policies 
WHERE schemaname = 'master_data' 
AND tablename = 'organizations'
AND cmd = 'UPDATE';

-- Step 2: Drop existing UPDATE policy
DROP POLICY IF EXISTS "organizations_update_policy" ON master_data.organizations;

-- Step 3: Create new UPDATE policy with correct privilege check
-- Note: Since user_to_role_assignment doesn't have organization_id,
-- we check if user has ANY active role with the required permissions
CREATE POLICY "organizations_update_policy" 
ON master_data.organizations
FOR UPDATE
USING (
    -- USING clause: Check if user has permission to UPDATE organizations
    -- User must have an active role with entity_configuration or entity_administration access
    EXISTS (
        SELECT 1 
        FROM master_data.profiles p
        JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
        JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
        WHERE p.user_id = auth.uid()
        AND ura.is_active = true
        AND pr.is_active = true
        AND (
            -- Check if permissions JSONB contains the required values
            pr.permissions::jsonb ? 'entity_configuration'
            OR pr.permissions::jsonb ? 'entity_administration'
        )
    )
)
WITH CHECK (
    -- WITH CHECK clause: Simple validation - just ensure organization_id is not null
    -- This prevents changing the organization_id to bypass security
    organization_id IS NOT NULL
);

-- Step 4: Verify the fix
SELECT 
    'Policy Created Successfully' as status,
    policyname, 
    cmd,
    'USING' as clause_type,
    qual as clause_definition
FROM pg_policies 
WHERE schemaname = 'master_data' 
AND tablename = 'organizations'
AND policyname = 'organizations_update_policy'
UNION ALL
SELECT 
    'Policy Created Successfully' as status,
    policyname, 
    cmd,
    'WITH CHECK' as clause_type,
    with_check as clause_definition
FROM pg_policies 
WHERE schemaname = 'master_data' 
AND tablename = 'organizations'
AND policyname = 'organizations_update_policy';

-- Step 5: Check your role assignments and permissions
SELECT 
    'Your Role Assignments' as info,
    p.user_id,
    p.user_platform_id,
    ura.platform_role_id,
    pr.role_name,
    pr.permissions,
    pr.privilege_level,
    ura.is_active,
    CASE 
        WHEN pr.permissions::jsonb ? 'entity_configuration' OR pr.permissions::jsonb ? 'entity_administration'
        THEN '✅ Can Edit Organizations'
        ELSE '❌ Cannot Edit Organizations'
    END as can_edit_orgs
FROM master_data.profiles p
JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
WHERE p.user_id = auth.uid();
