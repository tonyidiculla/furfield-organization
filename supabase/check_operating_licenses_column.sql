-- Check the current type of operating_licenses column
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'master_data' 
AND table_name = 'hospitals'
AND column_name = 'operating_licenses';

-- Check if there's any data in operating_licenses that might be causing issues
SELECT 
    entity_platform_id,
    operating_licenses,
    pg_typeof(operating_licenses) as type
FROM master_data.hospitals
WHERE operating_licenses IS NOT NULL
LIMIT 10;

-- If operating_licenses is not an array type, we need to convert it
-- First, let's see what the actual data looks like
SELECT DISTINCT 
    operating_licenses::text as license_value
FROM master_data.hospitals
WHERE operating_licenses IS NOT NULL;
