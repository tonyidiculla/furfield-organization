-- Check the 'level' column instead - it might have the numeric values
SELECT 
    role_name,
    level,
    privilege_level,
    category,
    pg_typeof(level) as level_type,
    pg_typeof(privilege_level) as privilege_level_type
FROM global.platform_roles
WHERE role_name IN (
    'platform_admin',
    'organization_admin',
    'entity_admin',
    'veterinary_technician',
    'ambulance_driver_transport_officer'
)
ORDER BY level;

-- Check all distinct level and privilege_level values
SELECT DISTINCT 
    level,
    privilege_level,
    category,
    COUNT(*) as count
FROM global.platform_roles
GROUP BY level, privilege_level, category
ORDER BY level;
