-- Solution 2: Map privilege_level text values to numbers that match the RLS policy expectation
-- This assumes the RLS policy expects: 1=highest privilege, 3=entity_admin level access

UPDATE master_data.platform_roles
SET privilege_level = CASE 
    WHEN privilege_level = 'platform_admin' THEN '1'
    WHEN privilege_level = 'organization_admin' THEN '2'
    WHEN privilege_level = 'entity_admin' THEN '3'
    WHEN privilege_level = 'department_manager' THEN '4'
    WHEN privilege_level IN ('clinical_staff', 'medical_practitioner', 'technical_specialist') THEN '5'
    WHEN privilege_level IN ('support_staff', 'operational_staff') THEN '6'
    ELSE privilege_level
END
WHERE privilege_level IN (
    'platform_admin', 'organization_admin', 'entity_admin', 
    'department_manager', 'clinical_staff', 'medical_practitioner', 
    'technical_specialist', 'support_staff', 'operational_staff'
);

-- Verify
SELECT privilege_level, category, COUNT(*) as count
FROM master_data.platform_roles
GROUP BY privilege_level, category
ORDER BY privilege_level::integer;
