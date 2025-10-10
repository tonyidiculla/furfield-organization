-- Check the structure of the modules table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'master_data' 
AND table_name = 'modules'
ORDER BY ordinal_position;

-- Check actual data in the modules table
SELECT 
    id,
    module_name,
    module_display_name,
    pg_typeof(id) as id_type
FROM master_data.modules
WHERE solution_type ILIKE '%hms%'
ORDER BY id
LIMIT 20;

-- Check if id column contains any non-numeric values
SELECT 
    id,
    module_name,
    CASE 
        WHEN id::text ~ '^[0-9]+$' THEN 'numeric'
        ELSE 'non-numeric'
    END as id_format
FROM master_data.modules
WHERE solution_type ILIKE '%hms%';
