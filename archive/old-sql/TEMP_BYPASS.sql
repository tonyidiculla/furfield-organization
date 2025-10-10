-- TEMPORARY BYPASS - Use ONLY for development/testing
-- This will allow ALL authenticated users to update organizations
-- WARNING: Remove this in production!

-- Step 1: Drop any existing policies
DROP POLICY IF EXISTS "organizations_update_policy" ON master_data.organizations;
DROP POLICY IF EXISTS "organizations_update_policy_temp" ON master_data.organizations;

-- Step 2: Create a permissive policy that allows all authenticated users
CREATE POLICY "organizations_update_policy_temp" 
ON master_data.organizations
FOR UPDATE
USING (
    -- Allow any authenticated user to update
    auth.uid() IS NOT NULL
)
WITH CHECK (
    -- Just ensure organization_id is not null
    organization_id IS NOT NULL
);

-- Step 3: Verify
SELECT 
    'Policy Created' as status,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'master_data'
AND tablename = 'organizations'
AND policyname = 'organizations_update_policy_temp';

SELECT '⚠️ WARNING: This is a temporary permissive policy for development only!' as warning;
SELECT '⚠️ TODO: Fix the role assignments and apply proper RLS policy before production' as todo;
