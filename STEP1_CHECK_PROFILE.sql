-- SIMPLE DIAGNOSTIC - Run each query one at a time
-- Start here: Check if you have a profile

SELECT 
    user_id,
    user_platform_id,
    email
FROM master_data.profiles
WHERE user_id = auth.uid();
