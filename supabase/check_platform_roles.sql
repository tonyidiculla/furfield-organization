-- Check platform_roles table and privilege_level column
SELECT 
    id,
    role_name,
    privilege_level,
    pg_typeof(privilege_level) as privilege_level_type,
    is_active
FROM master_data.platform_roles
ORDER BY id;

-- Check the data type of privilege_level
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'master_data'
  AND table_name = 'platform_roles'
  AND column_name = 'privilege_level';

-- Check if any role has "clinical_staff" as privilege_level
SELECT *
FROM master_data.platform_roles
WHERE privilege_level::text = 'clinical_staff'
   OR role_name ILIKE '%clinical_staff%';
