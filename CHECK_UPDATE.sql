-- Check if your organization was actually updated
SELECT 
    organization_name,
    website,
    organization_platform_id,
    owner_platform_id,
    manager_platform_id,
    updated_at,
    primary_color,
    secondary_color
FROM master_data.organizations
WHERE organization_id = '639e9d01-756f-4776-80ed-075e5cedefb6';
