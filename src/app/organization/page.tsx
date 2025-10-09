'use client'

import { useUser } from '@/contexts/UserContext'
import { OrganizationList } from '@/components/OrganizationList'
import { OrganizationPrivilegesBadge } from '@/components/OrganizationPrivilegesBadge'

export default function OrganizationPage() {
    const { user } = useUser()

    return (
        <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-100 px-6 py-16 text-slate-700">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(186,230,253,0.35),_transparent_55%),_radial-gradient(circle_at_bottom_right,_rgba(167,243,208,0.35),_transparent_45%)]" />

            <div className="relative mx-auto w-full max-w-6xl">
                {/* Organizations List */}
                <div className="rounded-3xl border border-white/70 bg-white/80 px-12 py-8 shadow-2xl backdrop-blur">
                    <OrganizationList />
                </div>
            </div>
        </div>
    )
}
