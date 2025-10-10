-- Check platform_id_mapping table for Company types
SELECT 
    id,
    category_code,
    category_name,
    type_code,
    type_name,
    type_description,
    is_active
FROM master_data.platform_id_mapping
WHERE category_code = 'C'
ORDER BY type_code;

-- If you need to update the mapping table to have C00 instead of C01/C02:
-- 
-- DELETE FROM master_data.platform_id_mapping WHERE category_code = 'C' AND type_code IN ('01', '02');
-- 
-- INSERT INTO master_data.platform_id_mapping (
--     category_code, 
--     category_name, 
--     category_description,
--     type_code, 
--     type_name, 
--     type_description,
--     is_active
-- ) VALUES (
--     'C',
--     'Company',
--     'Company and organization entities',
--     '00',
--     'Default',
--     'Company and organization entities',
--     true
-- );
