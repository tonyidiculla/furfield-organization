-- Check all integer columns in hospitals table
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'master_data' 
  AND table_name = 'hospitals' 
  AND data_type IN ('integer', 'bigint', 'smallint', 'int', 'int4', 'int8')
ORDER BY ordinal_position;

-- Also check for enum types that might be stored as integers
SELECT 
    column_name, 
    data_type, 
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'master_data' 
  AND table_name = 'hospitals' 
  AND udt_name LIKE '%int%'
ORDER BY ordinal_position;
