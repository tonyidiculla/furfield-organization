-- Copy privilege_level from backup/source table to platform_roles
-- Replace 'source_schema.source_table' with your actual backup table name

-- Method 1: Update based on matching role_name or id
UPDATE master_data.platform_roles pr
SET privilege_level = source.privilege_level
FROM backup_schema.platform_roles_backup source
WHERE pr.role_name = source.role_name;

-- Method 2: If matching by ID
UPDATE master_data.platform_roles pr
SET privilege_level = source.privilege_level
FROM backup_schema.platform_roles_backup source
WHERE pr.id = source.id;

-- Method 3: If you have the table in a different schema (like 'public')
UPDATE master_data.platform_roles pr
SET privilege_level = source.privilege_level
FROM public.platform_roles source
WHERE pr.role_name = source.role_name;

-- Verify after update
SELECT 
    role_name,
    privilege_level,
    category
FROM master_data.platform_roles
ORDER BY privilege_level::integer, role_name
LIMIT 20;
