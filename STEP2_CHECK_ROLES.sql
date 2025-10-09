-- Step 2: Check if you have role assignments

SELECT 
    id,
    user_platform_id,
    platform_role_id,
    is_active,
    created_at
FROM master_data.user_to_role_assignment
WHERE user_platform_id = (SELECT user_platform_id FROM master_data.profiles WHERE user_id = auth.uid());
