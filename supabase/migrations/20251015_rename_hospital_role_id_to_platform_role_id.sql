-- Rename hospital_role_id to platform_role_id in employee_to_hospital_role_assignment table
-- and add foreign key to platform_roles table

-- Step 1: Rename the column
ALTER TABLE master_data.employee_to_hospital_role_assignment
    RENAME COLUMN hospital_role_id TO platform_role_id;

-- Step 2: Add foreign key constraint to platform_roles
ALTER TABLE master_data.employee_to_hospital_role_assignment
    ADD CONSTRAINT fk_platform_role_id
    FOREIGN KEY (platform_role_id)
    REFERENCES master_data.platform_roles(id)
    ON DELETE SET NULL;

-- Step 3: Update the get_user_hospital_assignments function
CREATE OR REPLACE FUNCTION master_data.get_user_hospital_assignments(p_user_id UUID)
RETURNS TABLE (
    assignment_id UUID,
    employee_platform_id TEXT,
    hospital_id TEXT,
    hospital_name TEXT,
    platform_role_id UUID,
    department TEXT,
    is_active BOOLEAN,
    assigned_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ehra.id as assignment_id,
        ehra.employee_platform_id,
        ehra.hospital_id,
        h.business_name as hospital_name,
        ehra.platform_role_id,
        ehra.department,
        ehra.is_active,
        ehra.assigned_at,
        ehra.expires_at
    FROM master_data.employee_to_hospital_role_assignment ehra
    JOIN master_data.profiles p ON ehra.employee_platform_id = p.user_platform_id
    LEFT JOIN master_data.hospitals h ON ehra.hospital_id = h.entity_platform_id
    WHERE p.user_id = p_user_id
    AND ehra.is_active = true
    AND (ehra.expires_at IS NULL OR ehra.expires_at > NOW())
    ORDER BY ehra.assigned_at DESC;
END;
$$;

COMMENT ON FUNCTION master_data.get_user_hospital_assignments(UUID) IS 
'Returns all active hospital assignments for a user. Now uses platform_role_id instead of hospital_role_id.';
