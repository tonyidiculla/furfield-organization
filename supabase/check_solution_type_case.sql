-- Check solution_type case sensitivity in modules table
-- Run this in Supabase SQL Editor

-- Step 1: See all unique solution_type values (exact case)
SELECT DISTINCT solution_type, COUNT(*) as count
FROM master_data.modules
GROUP BY solution_type
ORDER BY solution_type;

-- Step 2: Check if 'HMS' exists (uppercase)
SELECT COUNT(*) as uppercase_hms_count
FROM master_data.modules
WHERE solution_type = 'HMS'
AND is_active = true;

-- Step 3: Check if 'hms' exists (lowercase)
SELECT COUNT(*) as lowercase_hms_count
FROM master_data.modules
WHERE solution_type = 'hms'
AND is_active = true;

-- Step 4: Check if 'Hms' or other variations exist
SELECT COUNT(*) as mixed_case_hms_count
FROM master_data.modules
WHERE solution_type ILIKE 'hms'
AND is_active = true;

-- Step 5: Show actual solution_type values with sample records
SELECT 
    id,
    module_name,
    solution_type,
    is_active,
    LENGTH(solution_type) as type_length,
    ascii(substring(solution_type from 1 for 1)) as first_char_ascii
FROM master_data.modules
ORDER BY solution_type, module_name;

-- Step 6: Check for whitespace or hidden characters
SELECT 
    module_name,
    solution_type,
    '|' || solution_type || '|' as solution_type_with_markers,
    LENGTH(solution_type) as length,
    TRIM(solution_type) as trimmed,
    is_active
FROM master_data.modules
ORDER BY module_name;
