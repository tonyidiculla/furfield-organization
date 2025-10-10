-- Check for triggers on the hospitals table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'master_data'
AND event_object_table = 'hospitals';

-- Check for all columns in hospitals table to see if there's a hidden integer column
SELECT 
    column_name,
    data_type,
    udt_name,
    column_default
FROM information_schema.columns
WHERE table_schema = 'master_data' 
AND table_name = 'hospitals'
AND data_type IN ('integer', 'bigint', 'smallint')
ORDER BY ordinal_position;

-- Check if there's a subscribed_modules column
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'master_data' 
AND table_name = 'hospitals'
AND column_name LIKE '%module%';
