-- Set owner_platform_id for your organization so it shows up in the list
UPDATE master_data.organizations
SET owner_platform_id = 'H00000001'
WHERE organization_id = '639e9d01-756f-4776-80ed-075e5cedefb6';

-- Verify it worked
SELECT 
    organization_id,
    organization_name,
    owner_platform_id,
    is_active
FROM master_data.organizations
WHERE organization_id = '639e9d01-756f-4776-80ed-075e5cedefb6';
