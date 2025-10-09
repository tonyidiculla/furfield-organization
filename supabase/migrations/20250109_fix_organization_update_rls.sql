-- Fix organization UPDATE RLS policy
-- The issue might be that the policy is checking owner_platform_id in both USING and WITH CHECK

-- First, let's check the current policy
SELECT * FROM pg_policies 
WHERE schemaname = 'master_data' 
AND tablename = 'organizations' 
AND cmd = 'UPDATE';

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Users can update their own organizations" ON master_data.organizations;

-- Create a new, simpler UPDATE policy
-- The USING clause determines which rows can be selected for update
-- The WITH CHECK clause determines what values can be set
CREATE POLICY "Users can update their own organizations"
ON master_data.organizations
FOR UPDATE
TO authenticated
USING (
    -- Can update if you own the organization (checking existing row)
    owner_platform_id IN (
        SELECT user_platform_id 
        FROM master_data.profiles 
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    -- After update, still must be owned by you (checking new values)
    owner_platform_id IN (
        SELECT user_platform_id 
        FROM master_data.profiles 
        WHERE user_id = auth.uid()
    )
);

-- Test query (run this to verify the policy works)
-- This should show you the organization that can be updated
SELECT 
    o.organization_id,
    o.organization_name,
    o.owner_platform_id,
    o.is_active,
    p.user_id,
    p.user_platform_id
FROM master_data.organizations o
JOIN master_data.profiles p ON o.owner_platform_id = p.user_platform_id
WHERE p.user_id = auth.uid();
