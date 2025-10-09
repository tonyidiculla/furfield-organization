/**
 * Platform roles and privilege types based on master_data schema
 */

export type PrivilegeLevel =
    | 'platform_admin'
    | 'organization_admin'
    | 'entity_admin'
    | 'department_manager'
    | 'medical_practitioner'
    | 'licensed_professional'
    | 'clinical_staff'
    | 'technical_specialist'
    | 'operational_staff'
    | 'support_staff'
    | 'management'
    | 'external_access'
    | 'user'

export type RoleCategory =
    | 'system_admin'
    | 'executive'
    | 'management'
    | 'medical_practitioner'
    | 'medical'
    | 'licensed_professional'
    | 'clinical_staff'
    | 'technical_specialist'
    | 'operational_staff'
    | 'support_staff'
    | 'staff'
    | 'external'
    | 'customer'

export interface PlatformRole {
    id: string
    role_name: string
    display_name: string
    description: string | null
    department: string
    category: RoleCategory
    level: number
    privilege_level: PrivilegeLevel
    permissions: string[]
    modules: string[]
    is_active: boolean
    created_at: string
    updated_at: string
    created_by: string | null
    solution_type: string[]
}

export interface UserRoleAssignment {
    id: string
    user_id: string
    is_active: boolean
    expires_at: string | null
    assigned_by: string | null
    assigned_at: string
    created_at: string
    updated_at: string
    user_platform_id: string | null
    is_immutable: boolean
    platform_role_id: string
}

export interface UserPrivileges {
    roles: PlatformRole[]
    assignments: UserRoleAssignment[]
    highestPrivilegeLevel: PrivilegeLevel | null
    allPermissions: Set<string>
    allModules: Set<string>
}

/**
 * Privilege level hierarchy (lower number = higher privilege)
 */
export const PRIVILEGE_HIERARCHY: Record<PrivilegeLevel, number> = {
    platform_admin: 1,
    organization_admin: 2,
    entity_admin: 3,
    department_manager: 4,
    management: 5,
    medical_practitioner: 6,
    licensed_professional: 7,
    clinical_staff: 8,
    technical_specialist: 9,
    operational_staff: 10,
    support_staff: 11,
    external_access: 12,
    user: 13,
}

/**
 * Check if a privilege level has access to a given minimum level
 */
export function hasPrivilegeLevel(
    userLevel: PrivilegeLevel | null,
    requiredLevel: PrivilegeLevel,
): boolean {
    if (!userLevel) return false

    const userRank = PRIVILEGE_HIERARCHY[userLevel]
    const requiredRank = PRIVILEGE_HIERARCHY[requiredLevel]

    return userRank <= requiredRank
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(privileges: UserPrivileges | null, permission: string): boolean {
    if (!privileges) return false
    return privileges.allPermissions.has(permission)
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(privileges: UserPrivileges | null, permissions: string[]): boolean {
    if (!privileges || permissions.length === 0) return false
    return permissions.some((permission) => privileges.allPermissions.has(permission))
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
    privileges: UserPrivileges | null,
    permissions: string[],
): boolean {
    if (!privileges || permissions.length === 0) return false
    return permissions.every((permission) => privileges.allPermissions.has(permission))
}

/**
 * Check if user has access to a module
 */
export function hasModule(privileges: UserPrivileges | null, module: string): boolean {
    if (!privileges) return false
    return privileges.allModules.has(module)
}

/**
 * Check if user has any of the specified modules
 */
export function hasAnyModule(privileges: UserPrivileges | null, modules: string[]): boolean {
    if (!privileges || modules.length === 0) return false
    return modules.some((module) => privileges.allModules.has(module))
}

/**
 * Get the display name of the highest-level role
 */
export function getPrimaryRoleDisplayName(privileges: UserPrivileges | null): string {
    if (!privileges || privileges.roles.length === 0) return 'User'

    const sortedRoles = [...privileges.roles].sort((a, b) => {
        const rankA = PRIVILEGE_HIERARCHY[a.privilege_level]
        const rankB = PRIVILEGE_HIERARCHY[b.privilege_level]
        return rankA - rankB
    })

    return sortedRoles[0]?.display_name ?? 'User'
}

/**
 * Aggregate user roles and permissions into a UserPrivileges object
 */
export function aggregatePrivileges(
    roles: PlatformRole[],
    assignments: UserRoleAssignment[],
): UserPrivileges {
    const activeRoles = roles.filter((role) => {
        const assignment = assignments.find((a) => a.platform_role_id === role.id && a.is_active)
        if (!assignment) return false

        if (assignment.expires_at) {
            const expiresAt = new Date(assignment.expires_at)
            if (expiresAt < new Date()) return false
        }

        return role.is_active
    })

    const allPermissions = new Set<string>()
    const allModules = new Set<string>()

    for (const role of activeRoles) {
        for (const permission of role.permissions) {
            allPermissions.add(permission)
        }
        for (const module of role.modules) {
            allModules.add(module)
        }
    }

    let highestPrivilegeLevel: PrivilegeLevel | null = null
    let highestRank = Number.MAX_VALUE

    for (const role of activeRoles) {
        const rank = PRIVILEGE_HIERARCHY[role.privilege_level]
        if (rank < highestRank) {
            highestRank = rank
            highestPrivilegeLevel = role.privilege_level
        }
    }

    return {
        roles: activeRoles,
        assignments: assignments.filter((a) => a.is_active),
        highestPrivilegeLevel,
        allPermissions,
        allModules,
    }
}
