-- Update organization platform IDs from C01/C02 to C00
-- This is needed because we merged company types to single C00 type

-- First, check what needs to be updated
SELECT 
    organization_id,
    organization_name,
    organization_platform_id,
    CASE 
        WHEN organization_platform_id LIKE 'C01%' THEN REPLACE(organization_platform_id, 'C01', 'C00')
        WHEN organization_platform_id LIKE 'C02%' THEN REPLACE(organization_platform_id, 'C02', 'C00')
        ELSE organization_platform_id
    END as new_platform_id
FROM master_data.organizations
WHERE organization_platform_id LIKE 'C01%' OR organization_platform_id LIKE 'C02%';

-- Update C01 to C00
-- UPDATE master_data.organizations
-- SET organization_platform_id = REPLACE(organization_platform_id, 'C01', 'C00')
-- WHERE organization_platform_id LIKE 'C01%';

-- Update C02 to C00
-- UPDATE master_data.organizations
-- SET organization_platform_id = REPLACE(organization_platform_id, 'C02', 'C00')
-- WHERE organization_platform_id LIKE 'C02%';

-- Verify the changes
-- SELECT 
--     organization_id,
--     organization_name,
--     organization_platform_id,
--     owner_platform_id
-- FROM master_data.organizations
-- WHERE organization_platform_id LIKE 'C00%';
