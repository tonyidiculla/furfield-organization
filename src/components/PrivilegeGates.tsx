/**
 * Reusable components for privilege-based UI rendering
 */

'use client'

import type { ReactNode } from 'react'

import { useUser } from '@/contexts/UserContext'
import type { PrivilegeLevel } from '@/lib/privileges'
import {
    hasPrivilegeLevel,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasModule,
    hasAnyModule,
} from '@/lib/privileges'

interface RequirePrivilegeLevelProps {
    level: PrivilegeLevel
    children: ReactNode
    fallback?: ReactNode
}

/**
 * Only render children if user has at least the specified privilege level
 */
export function RequirePrivilegeLevel({ level, children, fallback = null }: RequirePrivilegeLevelProps) {
    const { privileges, privilegesLoading } = useUser()

    if (privilegesLoading) {
        return null
    }

    const hasAccess = hasPrivilegeLevel(privileges?.highestPrivilegeLevel ?? null, level)

    return hasAccess ? <>{children}</> : <>{fallback}</>
}

interface RequirePermissionProps {
    permission: string
    children: ReactNode
    fallback?: ReactNode
}

/**
 * Only render children if user has the specified permission
 */
export function RequirePermission({ permission, children, fallback = null }: RequirePermissionProps) {
    const { privileges, privilegesLoading } = useUser()

    if (privilegesLoading) {
        return null
    }

    const hasAccess = hasPermission(privileges, permission)

    return hasAccess ? <>{children}</> : <>{fallback}</>
}

interface RequireAnyPermissionProps {
    permissions: string[]
    children: ReactNode
    fallback?: ReactNode
}

/**
 * Only render children if user has any of the specified permissions
 */
export function RequireAnyPermission({ permissions, children, fallback = null }: RequireAnyPermissionProps) {
    const { privileges, privilegesLoading } = useUser()

    if (privilegesLoading) {
        return null
    }

    const hasAccess = hasAnyPermission(privileges, permissions)

    return hasAccess ? <>{children}</> : <>{fallback}</>
}

interface RequireAllPermissionsProps {
    permissions: string[]
    children: ReactNode
    fallback?: ReactNode
}

/**
 * Only render children if user has all of the specified permissions
 */
export function RequireAllPermissions({ permissions, children, fallback = null }: RequireAllPermissionsProps) {
    const { privileges, privilegesLoading } = useUser()

    if (privilegesLoading) {
        return null
    }

    const hasAccess = hasAllPermissions(privileges, permissions)

    return hasAccess ? <>{children}</> : <>{fallback}</>
}

interface RequireModuleProps {
    module: string
    children: ReactNode
    fallback?: ReactNode
}

/**
 * Only render children if user has access to the specified module
 */
export function RequireModule({ module, children, fallback = null }: RequireModuleProps) {
    const { privileges, privilegesLoading } = useUser()

    if (privilegesLoading) {
        return null
    }

    const hasAccess = hasModule(privileges, module)

    return hasAccess ? <>{children}</> : <>{fallback}</>
}

interface RequireAnyModuleProps {
    modules: string[]
    children: ReactNode
    fallback?: ReactNode
}

/**
 * Only render children if user has access to any of the specified modules
 */
export function RequireAnyModule({ modules, children, fallback = null }: RequireAnyModuleProps) {
    const { privileges, privilegesLoading } = useUser()

    if (privilegesLoading) {
        return null
    }

    const hasAccess = hasAnyModule(privileges, modules)

    return hasAccess ? <>{children}</> : <>{fallback}</>
}
