-- Debug: Check if organization exists and why it's not showing
SELECT 
    organization_id,
    organization_name,
    organization_platform_id,
    owner_platform_id,
    is_active,
    deleted_at,
    CASE 
        WHEN owner_platform_id IS NULL THEN '❌ owner_platform_id is NULL'
        WHEN is_active != 'active' THEN '❌ is_active is not "active": ' || is_active
        WHEN deleted_at IS NOT NULL THEN '❌ deleted_at is set'
        ELSE '✅ Should be visible'
    END as visibility_status
FROM master_data.organizations
WHERE organization_platform_id = 'C00000001';

-- Check what the query in OrganizationList.tsx would return
-- Replace 'H00000001' with your actual user platform ID
SELECT 
    organization_id,
    organization_name,
    organization_platform_id,
    owner_platform_id,
    is_active
FROM master_data.organizations
WHERE owner_platform_id = 'H00000001'  -- <-- Update this to your user platform ID
  AND is_active = 'active'
ORDER BY created_at DESC;
