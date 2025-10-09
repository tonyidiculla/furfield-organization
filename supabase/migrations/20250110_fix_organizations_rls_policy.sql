-- Fix RLS Policy for Organizations Table
-- This uses the actual privilege system (profiles + user_to_role_assignment + platform_roles)

-- First, check current state
SELECT 'Current RLS Policies' as info;
SELECT policyname, cmd
FROM pg_policies 
WHERE schemaname = 'master_data' 
AND tablename = 'organizations';

-- Drop existing policies if they're too restrictive
DROP POLICY IF EXISTS "organizations_select_policy" ON master_data.organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON master_data.organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON master_data.organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON master_data.organizations;

-- Create new comprehensive policies using the actual privilege system

-- SELECT: Allow users to view organizations they have role assignments for
CREATE POLICY "organizations_select_policy" 
ON master_data.organizations
FOR SELECT
USING (
    EXISTS (
        SELECT 1 
        FROM master_data.profiles p
        JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
        WHERE p.user_id = auth.uid()
        AND ura.organization_id = organizations.organization_id
        AND ura.is_active = true
    )
);

-- INSERT: Allow users with entity_configuration or entity_administration access in ANY organization
CREATE POLICY "organizations_insert_policy" 
ON master_data.organizations
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM master_data.profiles p
        JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
        JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
        WHERE p.user_id = auth.uid()
        AND ura.is_active = true
        AND pr.is_active = true
        AND (
            pr.access_entity_configuration = true 
            OR pr.access_entity_administration = true
        )
    )
);

-- UPDATE: Allow users with entity_configuration or entity_administration access for THIS organization
CREATE POLICY "organizations_update_policy" 
ON master_data.organizations
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 
        FROM master_data.profiles p
        JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
        JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
        WHERE p.user_id = auth.uid()
        AND ura.organization_id = organizations.organization_id
        AND ura.is_active = true
        AND pr.is_active = true
        AND (
            pr.access_entity_configuration = true 
            OR pr.access_entity_administration = true
        )
    )
)
WITH CHECK (
    -- Keep it simple - just ensure organization_id is not null
    organization_id IS NOT NULL
);

-- DELETE: Allow users with entity_administration access only (for soft delete)
CREATE POLICY "organizations_delete_policy" 
ON master_data.organizations
FOR DELETE
USING (
    EXISTS (
        SELECT 1 
        FROM master_data.profiles p
        JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
        JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
        WHERE p.user_id = auth.uid()
        AND ura.organization_id = organizations.organization_id
        AND ura.is_active = true
        AND pr.is_active = true
        AND pr.access_entity_administration = true
    )
);

-- Verify new policies
SELECT 'New RLS Policies Created' as info;
SELECT policyname, cmd
FROM pg_policies 
WHERE schemaname = 'master_data' 
AND tablename = 'organizations'
ORDER BY cmd, policyname;

-- Test: Check current user's role assignments
SELECT 'Current User Role Assignments' as info;
SELECT 
    p.user_id,
    p.user_platform_id,
    ura.organization_id,
    pr.role_name,
    pr.access_entity_configuration,
    pr.access_entity_administration,
    ura.is_active,
    o.organization_name
FROM master_data.profiles p
JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
LEFT JOIN master_data.organizations o ON ura.organization_id = o.organization_id
WHERE p.user_id = auth.uid();
