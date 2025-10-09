'use client'

import { useUser } from '@/contexts/UserContext'

export function OrganizationPrivilegesBadge() {
    const { privileges, privilegesLoading } = useUser()

    console.log('[OrganizationPrivilegesBadge] privilegesLoading:', privilegesLoading)
    console.log('[OrganizationPrivilegesBadge] privileges:', privileges)

    if (privilegesLoading) {
        return (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
                <span className="text-sm text-slate-500">Loading...</span>
            </div>
        )
    }

    if (!privileges?.highestPrivilegeLevel || !privileges?.roles || privileges.roles.length === 0) {
        console.log('[OrganizationPrivilegesBadge] No privileges or roles, returning null')
        return null
    }

    // Find the role with the highest privilege (lowest level number)
    const highestRole = privileges.roles.reduce((highest, role) => {
        return role.level < highest.level ? role : highest
    })
    
    console.log('[OrganizationPrivilegesBadge] highestRole:', highestRole)

    const getLevelColor = (level: string) => {
        if (level === 'platform_admin') return 'from-purple-500 to-pink-500'
        if (level === 'org_admin' || level === 'organization_admin') return 'from-blue-500 to-cyan-500'
        if (level === 'facility_admin') return 'from-green-500 to-emerald-500'
        if (level.includes('management')) return 'from-orange-500 to-amber-500'
        return 'from-slate-500 to-slate-600'
    }

    return (
        <div className="flex flex-col items-end gap-2">
            <div className={`rounded-xl bg-gradient-to-r ${getLevelColor(privileges.highestPrivilegeLevel)} px-4 py-2 shadow-lg`}>
                <div className="text-xs font-medium text-white/80">Your Role</div>
                <div className="text-sm font-bold text-white">{highestRole.display_name}</div>
            </div>
            <div className="flex gap-2 text-xs text-slate-500">
                <span>🔑 {privileges.allPermissions.size} permissions</span>
                <span>•</span>
                <span>🧩 {privileges.allModules.size} modules</span>
            </div>
        </div>
    )
}
