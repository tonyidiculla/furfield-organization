-- Get ALL column information for hospitals table
SELECT 
    column_name,
    data_type,
    udt_name,
    column_default,
    is_nullable,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'master_data' 
  AND table_name = 'hospitals'
ORDER BY ordinal_position;
