-- Get complete table definition including constraints, defaults, and generated columns
SELECT 
    c.column_name,
    c.data_type,
    c.udt_name,
    c.column_default,
    c.is_nullable,
    c.is_generated,
    c.generation_expression,
    c.is_updatable
FROM information_schema.columns c
WHERE c.table_schema = 'master_data' 
  AND c.table_name = 'hospitals'
ORDER BY c.ordinal_position;

-- Check for check constraints
SELECT 
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'master_data'
  AND rel.relname = 'hospitals';

-- Search for "clinical_staff" in any constraint definitions
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'master_data'
  AND rel.relname = 'hospitals'
  AND pg_get_constraintdef(con.oid) ILIKE '%clinical_staff%';
