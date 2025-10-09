/**
 * RPC Functions for master_data Schema Access
 * 
 * This module provides typed functions to call PostgreSQL RPC functions
 * that access the master_data schema in a secure, controlled manner.
 */

import { supabase } from './supabase'

/**
 * Check if a user has a specific privilege level
 * @param userId - The user's UUID
 * @param requiredLevel - The minimum required privilege level (1-13, lower = higher privilege)
 * @returns true if user has the required privilege level or higher
 */
export async function checkUserPrivilegeLevel(
    userId: string,
    requiredLevel: number
): Promise<boolean> {
    const { data, error } = await supabase.rpc('user_has_privilege_level', {
        user_id_param: userId,
        required_level: requiredLevel,
    })

    if (error) {
        console.error('Error checking privilege level:', error)
        return false
    }

    return data ?? false
}

/**
 * Check if a user has a specific permission
 * @param userId - The user's UUID
 * @param permissionKey - The permission key to check (e.g., 'emr.admin')
 * @returns true if user has the permission
 */
export async function checkUserPermission(
    userId: string,
    permissionKey: string
): Promise<boolean> {
    const { data, error } = await supabase.rpc('user_has_permission', {
        user_id_param: userId,
        permission_key: permissionKey,
    })

    if (error) {
        console.error('Error checking permission:', error)
        return false
    }

    return data ?? false
}

/**
 * Check if a user has access to a specific module
 * @param userId - The user's UUID
 * @param moduleName - The module name to check (e.g., 'human_resources')
 * @returns true if user has access to the module
 */
export async function checkUserModule(
    userId: string,
    moduleName: string
): Promise<boolean> {
    const { data, error } = await supabase.rpc('user_has_module', {
        user_id_param: userId,
        module_name: moduleName,
    })

    if (error) {
        console.error('Error checking module access:', error)
        return false
    }

    return data ?? false
}

/**
 * Get details of a specific platform role
 * @param roleId - The role's UUID
 * @returns Platform role details or null
 */
export async function getPlatformRole(roleId: string) {
    const { data, error } = await supabase.rpc('get_platform_role', {
        role_id_param: roleId,
    })

    if (error) {
        console.error('Error fetching platform role:', error)
        return null
    }

    return data?.[0] ?? null
}

/**
 * List all available platform roles
 * @returns Array of platform roles with basic information
 */
export async function listPlatformRoles() {
    const { data, error } = await supabase.rpc('list_platform_roles')

    if (error) {
        console.error('Error listing platform roles:', error)
        return []
    }

    return data ?? []
}

/**
 * Assign a role to a user (admin only)
 * @param targetUserId - The user to assign the role to
 * @param roleId - The role to assign
 * @param expiresAt - Optional expiration date
 * @returns Assignment ID or null on error
 */
export async function assignRoleToUser(
    targetUserId: string,
    roleId: string,
    expiresAt?: string
): Promise<string | null> {
    const { data, error } = await supabase.rpc('assign_role_to_user', {
        target_user_id: targetUserId,
        role_id: roleId,
        expires_at_param: expiresAt || null,
    })

    if (error) {
        console.error('Error assigning role:', error)
        return null
    }

    return data
}

/**
 * Revoke a role from a user (admin only)
 * @param targetUserId - The user to revoke the role from
 * @param roleId - The role to revoke
 * @returns true if successful
 */
export async function revokeRoleFromUser(
    targetUserId: string,
    roleId: string
): Promise<boolean> {
    const { data, error } = await supabase.rpc('revoke_role_from_user', {
        target_user_id: targetUserId,
        role_id: roleId,
    })

    if (error) {
        console.error('Error revoking role:', error)
        return false
    }

    return data ?? false
}
