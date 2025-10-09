-- Check the actual data type of permissions column in platform_roles
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'master_data'
AND table_name = 'platform_roles'
AND column_name IN ('permissions', 'modules', 'access_entity_configuration', 'access_entity_administration');

-- Also check a sample of actual data
SELECT 
    role_name,
    permissions,
    pg_typeof(permissions) as permissions_type,
    modules,
    pg_typeof(modules) as modules_type
FROM master_data.platform_roles
LIMIT 3;
