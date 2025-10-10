-- Check the data types of all columns in the hospitals table
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'master_data' 
AND table_name = 'hospitals'
ORDER BY ordinal_position;

-- Specifically check if any column that should be TEXT is actually INTEGER
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'master_data' 
AND table_name = 'hospitals'
AND column_name IN (
    'hospital_type',
    'total_beds',
    'icu_beds',
    'treatment_rooms',
    'surgical_suites',
    'manager_platform_id',
    'manager_first_name',
    'manager_last_name'
)
ORDER BY column_name;
