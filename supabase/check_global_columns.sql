-- First, let's see what's in global.platform_roles privilege_level column
SELECT 
    role_name,
    level,
    privilege_level,
    category
FROM global.platform_roles
WHERE role_name IN (
    'platform_admin',
    'organization_admin', 
    'entity_admin',
    'veterinary_technician',
    'ambulance_driver_transport_officer',
    'clinical_staff'
)
ORDER BY role_name;

-- Show the data type
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'global'
  AND table_name = 'platform_roles'
  AND column_name IN ('level', 'privilege_level');
