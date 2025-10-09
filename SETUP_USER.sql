-- CREATE YOUR USER PROFILE AND ASSIGN ROLE
-- This will set up your account properly

-- Step 1: Create your profile (if it doesn't exist)
INSERT INTO master_data.profiles (user_id, user_platform_id, email)
VALUES (
    auth.uid(),
    'H00000001',  -- Your user platform ID
    'tony@fusionduotech.com'
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 2: Check if a platform_admin role exists
SELECT 
    'Available Roles' as info,
    id,
    role_name,
    privilege_level,
    permissions
FROM master_data.platform_roles
WHERE is_active = true
ORDER BY privilege_level
LIMIT 10;

-- Step 3: Assign yourself to a role with entity permissions
-- You'll need to replace 'ROLE_ID_HERE' with an actual role ID from Step 2
-- Look for a role that has entity_configuration or entity_administration in permissions

-- Example (uncomment and update with actual role ID):
/*
INSERT INTO master_data.user_to_role_assignment (
    user_platform_id,
    platform_role_id,
    is_active
)
VALUES (
    'H00000001',
    'ROLE_ID_HERE',  -- Replace with actual role ID from Step 2
    true
)
ON CONFLICT DO NOTHING;
*/

-- Step 4: Verify your setup
SELECT 
    'Your Profile' as check_name,
    user_id,
    user_platform_id,
    email
FROM master_data.profiles
WHERE user_id = auth.uid();
