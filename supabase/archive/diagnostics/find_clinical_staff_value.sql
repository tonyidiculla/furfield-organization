-- Get ALL columns and their values for this specific hospital
SELECT *
FROM master_data.hospitals 
WHERE entity_platform_id = 'E00000001';

-- Check specifically for "clinical_staff" anywhere
SELECT 
    entity_platform_id,
    entity_name,
    hospital_type,
    CASE 
        WHEN entity_name LIKE '%clinical_staff%' THEN 'FOUND IN entity_name'
        WHEN hospital_type LIKE '%clinical_staff%' THEN 'FOUND IN hospital_type'
        WHEN address LIKE '%clinical_staff%' THEN 'FOUND IN address'
        WHEN city LIKE '%clinical_staff%' THEN 'FOUND IN city'
        WHEN state LIKE '%clinical_staff%' THEN 'FOUND IN state'
        ELSE 'NOT FOUND'
    END as search_result
FROM master_data.hospitals 
WHERE entity_platform_id = 'E00000001';
