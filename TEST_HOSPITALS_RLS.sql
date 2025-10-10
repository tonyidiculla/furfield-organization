-- Test if RLS is blocking hospitals access

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'master_data' AND tablename = 'hospitals';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'master_data' AND tablename = 'hospitals';

-- Try to select hospitals directly
SELECT entity_platform_id, entity_name, organization_platform_id, is_active
FROM master_data.hospitals
WHERE organization_platform_id = 'C00jvdgrP';

-- Check if the user has a valid session
SELECT auth.uid() as current_user_id;

-- Check user's role assignments
SELECT ura.*, pr.role_name, pr.privilege_level
FROM master_data.profiles p
JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
WHERE p.user_id = auth.uid();
