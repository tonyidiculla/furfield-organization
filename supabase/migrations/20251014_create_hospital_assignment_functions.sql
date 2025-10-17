-- Helper function to get user's hospital assignments
-- This simplifies querying the complete authentication flow

CREATE OR REPLACE FUNCTION master_data.get_user_hospital_assignments(p_user_id UUID)
RETURNS TABLE (
    assignment_id UUID,
    employee_platform_id TEXT,
    hospital_id TEXT,
    hospital_name TEXT,
    hospital_role_id UUID,
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
        ehra.hospital_role_id,
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION master_data.get_user_hospital_assignments(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION master_data.get_user_hospital_assignments(UUID) TO anon;

-- Helper function to check if user has access to a specific hospital
CREATE OR REPLACE FUNCTION master_data.user_has_hospital_access(
    p_user_id UUID,
    p_hospital_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_access BOOLEAN;
    v_is_platform_admin BOOLEAN;
BEGIN
    -- Check if user is platform admin (has access to all hospitals)
    SELECT EXISTS (
        SELECT 1
        FROM master_data.profiles p
        JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
        JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
        WHERE p.user_id = p_user_id
        AND ura.is_active = true
        AND pr.is_active = true
        AND pr.privilege_level = 'platform_admin'
    ) INTO v_is_platform_admin;

    IF v_is_platform_admin THEN
        RETURN TRUE;
    END IF;

    -- Check if user has specific hospital assignment
    SELECT EXISTS (
        SELECT 1
        FROM master_data.employee_to_hospital_role_assignment ehra
        JOIN master_data.profiles p ON ehra.employee_platform_id = p.user_platform_id
        WHERE p.user_id = p_user_id
        AND ehra.hospital_id = p_hospital_id
        AND ehra.is_active = true
        AND (ehra.expires_at IS NULL OR ehra.expires_at > NOW())
    ) INTO v_has_access;

    RETURN v_has_access;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION master_data.user_has_hospital_access(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION master_data.user_has_hospital_access(UUID, TEXT) TO anon;

-- Helper function to get all accessible hospitals for a user
CREATE OR REPLACE FUNCTION master_data.get_user_accessible_hospitals(p_user_id UUID)
RETURNS TABLE (
    hospital_id TEXT,
    hospital_name TEXT,
    entity_type TEXT,
    is_active BOOLEAN,
    assigned_department TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_platform_admin BOOLEAN;
BEGIN
    -- Check if user is platform admin
    SELECT EXISTS (
        SELECT 1
        FROM master_data.profiles p
        JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
        JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
        WHERE p.user_id = p_user_id
        AND ura.is_active = true
        AND pr.is_active = true
        AND pr.privilege_level = 'platform_admin'
    ) INTO v_is_platform_admin;

    -- If platform admin, return all hospitals
    IF v_is_platform_admin THEN
        RETURN QUERY
        SELECT 
            h.entity_platform_id as hospital_id,
            h.business_name as hospital_name,
            h.entity_type,
            h.is_active,
            NULL::TEXT as assigned_department
        FROM master_data.hospitals h
        WHERE h.is_active = true
        ORDER BY h.business_name;
    ELSE
        -- Return only assigned hospitals
        RETURN QUERY
        SELECT 
            h.entity_platform_id as hospital_id,
            h.business_name as hospital_name,
            h.entity_type,
            h.is_active,
            ehra.department as assigned_department
        FROM master_data.employee_to_hospital_role_assignment ehra
        JOIN master_data.profiles p ON ehra.employee_platform_id = p.user_platform_id
        JOIN master_data.hospitals h ON ehra.hospital_id = h.entity_platform_id
        WHERE p.user_id = p_user_id
        AND ehra.is_active = true
        AND (ehra.expires_at IS NULL OR ehra.expires_at > NOW())
        AND h.is_active = true
        ORDER BY h.business_name;
    END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION master_data.get_user_accessible_hospitals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION master_data.get_user_accessible_hospitals(UUID) TO anon;

-- Add helpful comments
COMMENT ON FUNCTION master_data.get_user_hospital_assignments(UUID) IS 
'Returns all active hospital assignments for a user';

COMMENT ON FUNCTION master_data.user_has_hospital_access(UUID, TEXT) IS 
'Checks if a user has access to a specific hospital. Returns true for platform admins or users with active assignments.';

COMMENT ON FUNCTION master_data.get_user_accessible_hospitals(UUID) IS 
'Returns all hospitals accessible to a user. Platform admins get all hospitals, others get only assigned hospitals.';
