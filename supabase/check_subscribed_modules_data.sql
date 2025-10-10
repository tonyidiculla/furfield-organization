-- Check the subscribed_modules data for the specific entity
SELECT 
    entity_platform_id,
    entity_name,
    subscribed_modules,
    pg_typeof(subscribed_modules) as type
FROM master_data.hospitals
WHERE entity_platform_id = 'E00000001'; -- Replace with your actual entity ID

-- Check if subscribed_modules contains "clinical_staff" anywhere
SELECT 
    entity_platform_id,
    entity_name,
    subscribed_modules
FROM master_data.hospitals
WHERE subscribed_modules::text LIKE '%clinical_staff%';

-- Check the structure of subscribed_modules
SELECT DISTINCT
    jsonb_typeof(subscribed_modules) as modules_type,
    subscribed_modules
FROM master_data.hospitals
WHERE subscribed_modules IS NOT NULL
LIMIT 5;
