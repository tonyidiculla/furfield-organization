-- Check owner_platform_id for your organization
SELECT 
    organization_id,
    organization_name,
    owner_platform_id,
    owner_user_id,
    manager_platform_id,
    created_at
FROM master_data.organizations
WHERE organization_id = '639e9d01-756f-4776-80ed-075e5cedefb6';
