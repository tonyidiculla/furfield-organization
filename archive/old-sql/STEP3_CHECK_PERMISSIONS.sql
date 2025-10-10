-- Step 3: Check your role permissions

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
