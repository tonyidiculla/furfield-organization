-- Fix organization INSERT policy to allow platform admins and users with proper permissions

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "organizations_insert_policy" ON master_data.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON master_data.organizations;

-- Create new INSERT policy that allows:
-- 1. Platform admins
-- 2. Users with entity_configuration or entity_administration access
CREATE POLICY "organizations_insert_policy" 
ON master_data.organizations
FOR INSERT
WITH CHECK (
    -- Check if user is platform admin OR has entity configuration/administration access
    EXISTS (
        SELECT 1 
        FROM master_data.profiles p
        JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
        JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
        WHERE p.user_id = auth.uid()
        AND ura.is_active = true
        AND pr.is_active = true
        AND (
            pr.privilege_level <= 2  -- Platform admin or Organization admin
            OR pr.access_entity_configuration = true 
            OR pr.access_entity_administration = true
        )
    )
);

-- Verify the policy was created
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
WHERE tablename = 'organizations' 
AND policyname = 'organizations_insert_policy';
