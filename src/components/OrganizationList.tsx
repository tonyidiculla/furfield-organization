'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import type { Organization } from '@/types/organization'

export function OrganizationList() {
    const { user } = useUser()
    const router = useRouter()
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [userPlatformId, setUserPlatformId] = useState<string | null>(null)
    const [hasFetched, setHasFetched] = useState(false)

    useEffect(() => {
        async function fetchOrganizations() {
            if (!user?.id) {
                setLoading(false)
                return
            }

            // Prevent double fetching
            if (hasFetched) {
                return
            }

            try {
                setLoading(true)
                setError(null)

                // First, get user's platform ID
                const { data: profile, error: profileError } = await supabase
                    .schema('master_data')
                    .from('profiles')
                    .select('user_platform_id')
                    .eq('user_id', user.id)
                    .single()

                if (profileError || !profile?.user_platform_id) {
                    throw new Error('Could not find user profile')
                }

                setUserPlatformId(profile.user_platform_id)
                console.log('[OrganizationList] User platform ID:', profile.user_platform_id)

                // Fetch organizations - SELECT only fields needed for the list view
                console.log('[OrganizationList] Fetching organizations...')
                const { data: orgs, error: orgsError } = await supabase
                    .schema('master_data')
                    .from('organizations')
                    .select(`
                        id,
                        organization_id,
                        organization_platform_id,
                        organization_name,
                        brand_name,
                        email,
                        phone,
                        city,
                        state,
                        country,
                        is_active,
                        owner_platform_id,
                        logo_storage,
                        created_at,
                        updated_at
                    `)
                    .eq('owner_platform_id', profile.user_platform_id)
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false })

                console.log('[OrganizationList] Query result:', { count: orgs?.length || 0, error: orgsError })

                if (orgsError) {
                    throw orgsError
                }

                setOrganizations(orgs || [])
                setHasFetched(true)
            } catch (err: any) {
                console.error('Error fetching organizations:', err)
                setError(err.message || 'Failed to load organizations')
            } finally {
                setLoading(false)
            }
        }

        fetchOrganizations()
    }, [user?.id, hasFetched])

    const handleEdit = (organizationId: string) => {
        router.push(`/organization/${organizationId}/edit`)
    }

    const handleToggleActive = async (organizationId: string, currentStatus: string) => {
        try {
            console.log('[handleToggleActive] Starting status toggle:', { organizationId, currentStatus })
            console.log('[handleToggleActive] User info:', { userId: user?.id, userPlatformId })
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
            
            const { data, error } = await supabase
                .schema('master_data')
                .from('organizations')
                .update({ is_active: newStatus })
                .eq('organization_id', organizationId)
                .select()

            console.log('[handleToggleActive] Update result:', { data, error })

            if (error) {
                console.error('[handleToggleActive] Error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                })
                throw error
            }

            if (!data || data.length === 0) {
                throw new Error('No rows were updated. This might be an RLS policy issue.')
            }

            // Update local state
            setOrganizations(prev =>
                prev.map(org =>
                    org.organization_id === organizationId
                        ? { ...org, is_active: newStatus }
                        : org
                )
            )

            console.log(`✅ Organization status updated to: ${newStatus}`)
        } catch (err) {
            console.error('❌ Error toggling organization status:', err)
            setError(err instanceof Error ? err.message : 'Failed to update organization status')
        }
    }

    const handleGoToEntities = (organizationPlatformId: string) => {
        router.push(`/organization/${organizationPlatformId}/entities`)
    }

    if (loading) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center">
                <div className="text-slate-600">Loading organizations...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4">
                <p className="text-sm text-red-700">❌ {error}</p>
            </div>
        )
    }

    console.log('[OrganizationList] Rendering with organizations:', organizations.length, organizations)

    const activeCount = organizations.filter(org => org.is_active === 'active').length
    const inactiveCount = organizations.length - activeCount

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                        Your Organizations ({organizations.length})
                    </h2>
                    {organizations.length > 0 && (
                        <p className="mt-1 text-sm text-slate-600">
                            {activeCount} active{inactiveCount > 0 ? `, ${inactiveCount} inactive` : ''}
                        </p>
                    )}
                </div>
                <button
                    onClick={() => router.push('/organization/create')}
                    className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white shadow-lg transition-all hover:bg-sky-700 hover:shadow-xl"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Organization
                </button>
            </div>

            {organizations.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                        <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-800">No Organizations</h3>
                    <p className="text-sm text-slate-600">
                        You don't have any organizations yet.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                                    Organization
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                                    Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {organizations.map((org) => (
                                <tr key={org.id} className="transition hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {org.logo_storage?.url ? (
                                                <img 
                                                    src={org.logo_storage.url} 
                                                    alt={org.organization_name} 
                                                    className="h-10 w-10 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-emerald-500">
                                                    <span className="text-sm font-bold text-white">
                                                        {org.organization_name?.charAt(0).toUpperCase() || 'O'}
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-slate-900">
                                                    {org.organization_name || 'Unnamed Organization'}
                                                </div>
                                                {org.brand_name && (
                                                    <div className="text-sm text-slate-500">{org.brand_name}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1 text-sm">
                                            {org.email && (
                                                <div className="flex items-center gap-1 text-slate-600">
                                                    <span>📧</span>
                                                    <span>{org.email}</span>
                                                </div>
                                            )}
                                            {org.phone && (
                                                <div className="flex items-center gap-1 text-slate-600">
                                                    <span>📞</span>
                                                    <span>{org.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {org.city && (
                                            <div className="text-sm text-slate-600">
                                                {org.city}{org.state ? `, ${org.state}` : ''}{org.country ? `, ${org.country}` : ''}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-block h-2 w-2 rounded-full ${org.is_active === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                            <span className="text-sm font-medium text-slate-700">
                                                {org.is_active === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                            <button
                                                onClick={() => handleToggleActive(org.organization_id, org.is_active)}
                                                className="ml-1 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-sky-600"
                                                title={org.is_active === 'active' ? 'Deactivate Organization' : 'Activate Organization'}
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleGoToEntities(org.organization_platform_id)}
                                                className="rounded-lg p-2 text-sky-600 transition hover:bg-sky-50"
                                                title="Go to Entities"
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleEdit(org.organization_id)}
                                                className="rounded-lg bg-slate-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-600"
                                                title="Edit Organization"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
