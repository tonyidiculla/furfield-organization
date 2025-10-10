-- Check organization platform IDs and owner platform IDs
SELECT 
    organization_id,
    organization_name,
    organization_platform_id,
    owner_platform_id,
    is_active,
    created_at
FROM master_data.organizations
WHERE deleted_at IS NULL
ORDER BY created_at DESC;
