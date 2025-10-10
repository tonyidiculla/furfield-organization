-- Query to list all functions in the database
-- Run this in Supabase SQL Editor to validate actual functions

-- List all functions in public and master_data schemas
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
        WHEN p.provolatile = 's' THEN 'STABLE'
        WHEN p.provolatile = 'v' THEN 'VOLATILE'
    END as volatility,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security,
    pg_get_userbyid(p.proowner) as owner,
    l.lanname as language
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname IN ('public', 'master_data')
    AND p.prokind = 'f'  -- Only functions (not procedures)
ORDER BY n.nspname, p.proname;

-- More detailed view with descriptions
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_catalog.obj_description(p.oid, 'pg_proc') as description
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'master_data')
    AND p.prokind = 'f'
ORDER BY n.nspname, p.proname;
