-- Map privilege_level text values to numeric levels based on the hierarchy
-- We'll create a mapping based on typical privilege levels

UPDATE master_data.platform_roles
SET privilege_level = CASE privilege_level
    WHEN 'platform_admin' THEN '1'
    WHEN 'organization_admin' THEN '2'
    WHEN 'entity_admin' THEN '3'
    WHEN 'department_manager' THEN '4'
    WHEN 'clinical_staff' THEN '5'
    WHEN 'medical_practitioner' THEN '5'
    WHEN 'technical_specialist' THEN '5'
    WHEN 'support_staff' THEN '6'
    WHEN 'operational_staff' THEN '7'
    ELSE privilege_level  -- Keep any numeric values as-is
END
WHERE privilege_level IN ('platform_admin', 'organization_admin', 'entity_admin', 'department_manager', 'clinical_staff', 'medical_practitioner', 'technical_specialist', 'support_staff', 'operational_staff');

-- Verify the changes
SELECT 
    privilege_level,
    category,
    COUNT(*) as role_count
FROM master_data.platform_roles
GROUP BY privilege_level, category
ORDER BY privilege_level::integer;

-- Check specific roles
SELECT 
    role_name,
    privilege_level,
    category
FROM master_data.platform_roles
WHERE role_name IN (
    'veterinary_technician',
    'ambulance_driver_transport_officer',
    'lead_veterinary_technician'
)
ORDER BY role_name;
