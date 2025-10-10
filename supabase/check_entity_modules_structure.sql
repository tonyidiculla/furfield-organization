-- Check the structure of entity_modules table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'entity_modules'
ORDER BY ordinal_position;

-- Check actual data in entity_modules table
SELECT 
    entity_platform_id,
    module_id,
    pg_typeof(module_id) as module_id_type
FROM entity_modules
LIMIT 20;

-- If module_id is text type, show the problematic values
SELECT DISTINCT 
    module_id,
    pg_typeof(module_id) as data_type
FROM entity_modules;
