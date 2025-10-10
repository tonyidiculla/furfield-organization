import { supabase } from './supabase'
import type { PlatformRole, UserRoleAssignment, UserPrivileges } from './privileges'
import { aggregatePrivileges } from './privileges'

/**
 * Fetch platform roles and assignments for a given user
 * Now using direct master_data schema access since it's been exposed
 */
export async function fetchUserPrivileges(userId: string): Promise<UserPrivileges | null> {
    try {
        console.log('[fetchUserPrivileges] Starting fetch for user:', userId)
        
        // First, get the user's platform_id from profiles in master_data schema
        const { data: profile, error: profileError } = await supabase
            .schema('master_data')
            .from('profiles')
            .select('user_platform_id')
            .eq('user_id', userId)
            .single()

        console.log('[fetchUserPrivileges] Profile query result:', { profile, error: profileError })

        if (profileError || !profile?.user_platform_id) {
            console.error('[fetchUserPrivileges] Error fetching user profile or no user_platform_id:', profileError)
            return null
        }

        const userPlatformId = profile.user_platform_id
        console.log('[fetchUserPrivileges] Found user_platform_id:', userPlatformId)

        // Now query using user_platform_id instead of user_id
        const { data: assignments, error: assignmentsError } = await supabase
            .schema('master_data')
            .from('user_to_role_assignment')
            .select('*')
            .eq('user_platform_id', userPlatformId)
            .eq('is_active', true)

        console.log('[fetchUserPrivileges] Assignments query result:', { 
            count: assignments?.length || 0, 
            error: assignmentsError 
        })

        if (assignmentsError) {
            console.error('[fetchUserPrivileges] Error fetching role assignments:', assignmentsError)
            return null
        }

        if (!assignments || assignments.length === 0) {
            return {
                roles: [],
                assignments: [],
                highestPrivilegeLevel: null,
                allPermissions: new Set(),
                allModules: new Set(),
            }
        }

        // Get role IDs
        const roleIds = assignments.map((a) => a.platform_role_id).filter(Boolean)

        if (roleIds.length === 0) {
            return {
                roles: [],
                assignments: assignments as UserRoleAssignment[],
                highestPrivilegeLevel: null,
                allPermissions: new Set(),
                allModules: new Set(),
            }
        }

        // Fetch the corresponding platform roles
        const { data: roles, error: rolesError } = await supabase
            .schema('master_data')
            .from('platform_roles')
            .select('*')
            .in('id', roleIds)
            .eq('is_active', true)

        console.log('[fetchUserPrivileges] Roles query result:', {
            count: roles?.length || 0,
            error: rolesError
        })

        if (rolesError) {
            console.error('[fetchUserPrivileges] Error fetching platform roles:', rolesError)
            return null
        }

        const result = aggregatePrivileges(
            (roles as PlatformRole[]) ?? [],
            (assignments as UserRoleAssignment[]) ?? [],
        )
        
        console.log('[fetchUserPrivileges] Final result:', {
            rolesCount: result.roles.length,
            highestPrivilege: result.highestPrivilegeLevel,
            permissionsCount: result.allPermissions.size,
            modulesCount: result.allModules.size
        })

        return result
    } catch (error) {
        console.error('Unexpected error fetching user privileges:', error)
        return null
    }
}
