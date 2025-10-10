-- Check for ALL triggers on hospitals table (including BEFORE UPDATE)
SELECT 
    tgname AS trigger_name,
    tgtype,
    tgenabled,
    CASE tgtype::integer & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END AS trigger_timing,
    CASE tgtype::integer & cast(28 as int2)
        WHEN 4 THEN 'INSERT'
        WHEN 8 THEN 'DELETE'
        WHEN 16 THEN 'UPDATE'
        WHEN 20 THEN 'INSERT OR UPDATE'
        WHEN 24 THEN 'DELETE OR UPDATE'
        WHEN 28 THEN 'INSERT OR UPDATE OR DELETE'
    END AS trigger_event,
    pg_get_functiondef(tgfoid) AS function_definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'master_data'
  AND c.relname = 'hospitals'
  AND NOT tgisinternal;

-- Alternative check
SELECT 
    event_object_table,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'master_data'
  AND event_object_table = 'hospitals';
