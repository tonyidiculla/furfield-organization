-- Show all fields from the hospitals (entities) table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'master_data' 
AND table_name = 'hospitals'
ORDER BY ordinal_position;

-- Also show a sample record to see the data
SELECT *
FROM master_data.hospitals
LIMIT 1;
