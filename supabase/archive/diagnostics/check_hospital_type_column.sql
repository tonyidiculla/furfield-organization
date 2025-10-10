-- Check hospital_type data type specifically
SELECT 
    column_name,
    data_type,
    udt_name,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'master_data' 
  AND table_name = 'hospitals' 
  AND column_name = 'hospital_type';

-- Check if there's a separate hospital_types table with an integer ID
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'master_data' 
  AND table_name LIKE '%hospital%type%';

-- Look for any enum types
SELECT 
    t.typname,
    e.enumlabel
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'master_data'
  AND t.typname LIKE '%hospital%'
ORDER BY t.typname, e.enumsortorder;
