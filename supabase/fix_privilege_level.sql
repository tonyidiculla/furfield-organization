-- Fix privilege_level in platform_roles table
-- It should be numeric, not text like "clinical_staff"

-- First, let's see what unique privilege_level values exist
SELECT DISTINCT privilege_level, COUNT(*) as count
FROM master_data.platform_roles
GROUP BY privilege_level
ORDER BY privilege_level;

-- Based on the typical privilege hierarchy:
-- platform_admin = 1 (highest)
-- organization_admin = 2
-- entity_admin = 3
-- department_head = 4
-- clinical_staff = 5 (or higher number, lower privilege)

-- Update all roles with "clinical_staff" to a numeric value
-- Assuming clinical_staff should be privilege level 5
UPDATE master_data.platform_roles
SET privilege_level = '5'
WHERE privilege_level = 'clinical_staff';

-- Verify the change
SELECT 
    role_name,
    privilege_level,
    category
FROM master_data.platform_roles
WHERE role_name IN (
    'ambulance_driver_transport_officer',
    'grants_research_funding_officer',
    'grooming_specialist',
    'lead_veterinary_technician',
    'veterinary_technician'
)
ORDER BY role_name;
