-- Check all unique privilege_level values
SELECT DISTINCT 
    privilege_level,
    category,
    COUNT(*) as role_count
FROM master_data.platform_roles
GROUP BY privilege_level, category
ORDER BY privilege_level;
