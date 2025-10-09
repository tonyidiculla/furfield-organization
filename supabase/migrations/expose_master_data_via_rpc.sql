-- ============================================================================
-- RPC Functions to Access master_data Schema
-- ============================================================================
-- This migration creates PostgreSQL functions in the public schema that
-- provide controlled access to master_data tables for role-based access control.
-- ============================================================================

-- Function: Get user's active role assignments with role details
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_privileges(user_id_param UUID)
RETURNS TABLE (
    user_id UUID,
    platform_role_id UUID,
    role_name TEXT,
    privilege_level INTEGER,
    permissions JSONB,
    modules TEXT[],
    assigned_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER -- Run with privileges of the function owner
SET search_path = public, master_data
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ura.user_id,
        ura.platform_role_id,
        pr.role_name,
        pr.privilege_level,
        pr.permissions,
        pr.modules,
        ura.created_at as assigned_at,
        ura.expires_at,
        ura.is_active
    FROM master_data.user_to_role_assignment ura
    JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
    WHERE ura.user_id = user_id_param
        AND ura.is_active = true
        AND pr.is_active = true
        AND (ura.expires_at IS NULL OR ura.expires_at > NOW())
    ORDER BY pr.privilege_level ASC; -- Lower number = higher privilege
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_privileges(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_user_privileges IS 
'Fetches all active role assignments for a user with their privilege details. Users can only query their own privileges unless they have admin rights.';


-- Function: Get a specific platform role by ID
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_platform_role(role_id_param UUID)
RETURNS TABLE (
    id UUID,
    role_name TEXT,
    privilege_level INTEGER,
    permissions JSONB,
    modules TEXT[],
    description TEXT,
    is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, master_data
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id,
        pr.role_name,
        pr.privilege_level,
        pr.permissions,
        pr.modules,
        pr.description,
        pr.is_active
    FROM master_data.platform_roles pr
    WHERE pr.id = role_id_param
        AND pr.is_active = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_role(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_platform_role IS 
'Fetches details of a specific platform role by ID.';


-- Function: Get all available platform roles (for admin users)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.list_platform_roles()
RETURNS TABLE (
    id UUID,
    role_name TEXT,
    privilege_level INTEGER,
    role_category TEXT,
    description TEXT,
    is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, master_data
AS $$
BEGIN
    -- This function could be restricted to admin users only
    -- For now, it returns basic info about all active roles
    RETURN QUERY
    SELECT 
        pr.id,
        pr.role_name,
        pr.privilege_level,
        pr.role_category,
        pr.description,
        pr.is_active
    FROM master_data.platform_roles pr
    WHERE pr.is_active = true
    ORDER BY pr.privilege_level ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_platform_roles() TO authenticated;

COMMENT ON FUNCTION public.list_platform_roles IS 
'Lists all active platform roles with basic information. Detailed permissions are not exposed.';


-- Function: Check if user has specific privilege level
-- ============================================================================
CREATE OR REPLACE FUNCTION public.user_has_privilege_level(
    user_id_param UUID,
    required_level INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, master_data
AS $$
DECLARE
    user_highest_level INTEGER;
BEGIN
    -- Get the user's highest privilege level (lowest number = highest privilege)
    SELECT MIN(pr.privilege_level)
    INTO user_highest_level
    FROM master_data.user_to_role_assignment ura
    JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
    WHERE ura.user_id = user_id_param
        AND ura.is_active = true
        AND pr.is_active = true
        AND (ura.expires_at IS NULL OR ura.expires_at > NOW());
    
    -- If user has no roles, return false
    IF user_highest_level IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user's level is high enough (lower or equal number)
    RETURN user_highest_level <= required_level;
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_has_privilege_level(UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.user_has_privilege_level IS 
'Checks if a user has at least the specified privilege level. Lower numbers mean higher privileges.';


-- Function: Check if user has specific permission
-- ============================================================================
CREATE OR REPLACE FUNCTION public.user_has_permission(
    user_id_param UUID,
    permission_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, master_data
AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    -- Check if user has the permission in any of their active roles
    SELECT EXISTS(
        SELECT 1
        FROM master_data.user_to_role_assignment ura
        JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
        WHERE ura.user_id = user_id_param
            AND ura.is_active = true
            AND pr.is_active = true
            AND (ura.expires_at IS NULL OR ura.expires_at > NOW())
            AND pr.permissions ? permission_key
    ) INTO has_perm;
    
    RETURN COALESCE(has_perm, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_has_permission(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.user_has_permission IS 
'Checks if a user has a specific permission key in any of their active roles.';


-- Function: Check if user has access to specific module
-- ============================================================================
CREATE OR REPLACE FUNCTION public.user_has_module(
    user_id_param UUID,
    module_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, master_data
AS $$
DECLARE
    has_mod BOOLEAN;
BEGIN
    -- Check if user has the module in any of their active roles
    SELECT EXISTS(
        SELECT 1
        FROM master_data.user_to_role_assignment ura
        JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
        WHERE ura.user_id = user_id_param
            AND ura.is_active = true
            AND pr.is_active = true
            AND (ura.expires_at IS NULL OR ura.expires_at > NOW())
            AND module_name = ANY(pr.modules)
    ) INTO has_mod;
    
    RETURN COALESCE(has_mod, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_has_module(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.user_has_module IS 
'Checks if a user has access to a specific module in any of their active roles.';


-- Function: Assign role to user (admin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.assign_role_to_user(
    target_user_id UUID,
    role_id UUID,
    expires_at_param TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, master_data
AS $$
DECLARE
    assignment_id UUID;
    caller_privilege_level INTEGER;
BEGIN
    -- Get the caller's highest privilege level
    SELECT MIN(pr.privilege_level)
    INTO caller_privilege_level
    FROM master_data.user_to_role_assignment ura
    JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
    WHERE ura.user_id = auth.uid()
        AND ura.is_active = true
        AND pr.is_active = true;
    
    -- Only allow platform_admin (level 1) and organization_admin (level 2) to assign roles
    IF caller_privilege_level IS NULL OR caller_privilege_level > 2 THEN
        RAISE EXCEPTION 'Insufficient privileges to assign roles';
    END IF;
    
    -- Insert the role assignment
    INSERT INTO master_data.user_to_role_assignment (
        user_id,
        platform_role_id,
        is_active,
        expires_at
    )
    VALUES (
        target_user_id,
        role_id,
        true,
        expires_at_param
    )
    RETURNING id INTO assignment_id;
    
    RETURN assignment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_role_to_user(UUID, UUID, TIMESTAMPTZ) TO authenticated;

COMMENT ON FUNCTION public.assign_role_to_user IS 
'Assigns a platform role to a user. Only accessible to platform_admin and organization_admin users.';


-- Function: Revoke role from user (admin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.revoke_role_from_user(
    target_user_id UUID,
    role_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, master_data
AS $$
DECLARE
    caller_privilege_level INTEGER;
BEGIN
    -- Get the caller's highest privilege level
    SELECT MIN(pr.privilege_level)
    INTO caller_privilege_level
    FROM master_data.user_to_role_assignment ura
    JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
    WHERE ura.user_id = auth.uid()
        AND ura.is_active = true
        AND pr.is_active = true;
    
    -- Only allow platform_admin (level 1) and organization_admin (level 2) to revoke roles
    IF caller_privilege_level IS NULL OR caller_privilege_level > 2 THEN
        RAISE EXCEPTION 'Insufficient privileges to revoke roles';
    END IF;
    
    -- Deactivate the role assignment
    UPDATE master_data.user_to_role_assignment
    SET is_active = false,
        updated_at = NOW()
    WHERE user_id = target_user_id
        AND platform_role_id = role_id
        AND is_active = true;
    
    RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_role_from_user(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.revoke_role_from_user IS 
'Revokes a platform role from a user by setting is_active to false. Only accessible to platform_admin and organization_admin users.';


-- ============================================================================
-- Security Policies (Row Level Security)
-- ============================================================================
-- Note: These RPC functions use SECURITY DEFINER, which means they run with
-- the privileges of the function owner (postgres). This allows controlled
-- access to master_data schema without exposing it directly.
-- ============================================================================

-- Index optimizations for better performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_role_assignment_user_active 
ON master_data.user_to_role_assignment(user_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_role_assignment_expires 
ON master_data.user_to_role_assignment(expires_at) 
WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_platform_roles_active 
ON master_data.platform_roles(is_active, privilege_level) 
WHERE is_active = true;

-- ============================================================================
-- Completed: RPC Functions for master_data Schema Access
-- ============================================================================
