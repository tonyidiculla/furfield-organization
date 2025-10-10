-- Step 1: Copy the correct privilege_level values from global.platform_roles to master_data.platform_roles
-- This will restore any corrupted text values

UPDATE master_data.platform_roles pr
SET privilege_level = source.privilege_level
FROM global.platform_roles source
WHERE pr.role_name = source.role_name;

-- Verify the copy worked
SELECT 
    privilege_level,
    COUNT(*) as role_count
FROM master_data.platform_roles
GROUP BY privilege_level
ORDER BY privilege_level;

-- Check specific roles that had "clinical_staff"
SELECT 
    role_name,
    privilege_level,
    category
FROM master_data.platform_roles
WHERE role_name IN (
    'veterinary_technician',
    'ambulance_driver_transport_officer',
    'lead_veterinary_technician',
    'platform_admin',
    'organization_admin',
    'entity_admin'
)
ORDER BY role_name;
