-- Step 2: Fix the RLS policy to use text comparison instead of integer casting

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS hospitals_update_policy ON master_data.hospitals;

-- Recreate it with correct privilege_level comparison (text-based)
-- Allow platform_admin, organization_admin, and entity_admin to update
CREATE POLICY hospitals_update_policy ON master_data.hospitals
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM master_data.profiles p
    JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
    JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
    WHERE p.user_id = auth.uid()
      AND ura.is_active = true
      AND pr.is_active = true
      AND pr.privilege_level IN ('platform_admin', 'organization_admin', 'entity_admin')
  )
);

-- Verify the policy was created correctly
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'master_data' 
  AND tablename = 'hospitals'
  AND policyname = 'hospitals_update_policy';
