-- Test updating brand_name directly
-- Replace the UUID with your actual organization_id

-- First check current value
SELECT 
    organization_id,
    organization_name,
    brand_name,
    owner_platform_id
FROM master_data.organizations
WHERE organization_name LIKE '%your-org-name%';  -- Update this

-- Test update (uncomment and update the UUID)
-- UPDATE master_data.organizations
-- SET brand_name = 'Test Brand Name',
--     updated_at = now()
-- WHERE organization_id = '639e9d01-756f-4776-80ed-075e5cedefb6';  -- Your org ID

-- Verify update worked
-- SELECT 
--     organization_id,
--     organization_name,
--     brand_name,
--     updated_at
-- FROM master_data.organizations
-- WHERE organization_id = '639e9d01-756f-4776-80ed-075e5cedefb6';
