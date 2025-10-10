-- Copy privilege_level from global.platform_roles to master_data.platform_roles
-- Matching on role_name

UPDATE master_data.platform_roles pr
SET privilege_level = source.privilege_level
FROM global.platform_roles source
WHERE pr.role_name = source.role_name;

-- Verify the update
SELECT 
    role_name,
    privilege_level,
    category,
    pg_typeof(privilege_level) as data_type
FROM master_data.platform_roles
WHERE role_name IN (
    'ambulance_driver_transport_officer',
    'veterinary_technician',
    'lead_veterinary_technician',
    'platform_admin',
    'organization_admin',
    'entity_admin'
)
ORDER BY privilege_level::integer;

-- Check how many rows were updated
SELECT COUNT(*) as total_roles,
       COUNT(CASE WHEN privilege_level ~ '^\d+$' THEN 1 END) as numeric_privilege_levels,
       COUNT(CASE WHEN privilege_level = 'clinical_staff' THEN 1 END) as still_clinical_staff
FROM master_data.platform_roles;
