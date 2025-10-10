'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'

interface Entity {
    entity_platform_id: string
    entity_name: string | null
    organization_platform_id: string | null
    manager_email_id: string | null
    manager_phone_number: string | null
    address: string | null
    city: string | null
    state: string | null
    post_code: string | null
    country: string | null
    is_active: boolean
    created_at: string
}

interface Organization {
    organization_id: string
    organization_name: string
    organization_platform_id: string
}

export default function OrganizationEntitiesPage() {
    const { user } = useUser()
    const router = useRouter()
    const params = useParams()
    const organizationPlatformId = params.id as string
    
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [entities, setEntities] = useState<Entity[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            if (!user?.id || !organizationPlatformId) {
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError(null)

                // Fetch organization details using platform ID
                const { data: orgData, error: orgError } = await supabase
                    .schema('master_data')
                    .from('organizations')
                    .select('organization_id, organization_name, organization_platform_id')
                    .eq('organization_platform_id', organizationPlatformId)
                    .single()

                if (orgError) throw orgError
                setOrganization(orgData)

                // Fetch entities for this organization using the organization's platform ID
                console.log('[EntitiesPage] Fetching hospitals for org platform ID:', organizationPlatformId)
                
                // First, let's try a simple count query to test RLS
                const { count: testCount, error: testError } = await supabase
                    .schema('master_data')
                    .from('hospitals')
                    .select('*', { count: 'exact', head: true })
                
                console.log('[EntitiesPage] Test count query:', { count: testCount, error: testError })
                
                const { data: entitiesData, error: entitiesError } = await supabase
                    .schema('master_data')
                    .from('hospitals')
                    .select(`
                        entity_platform_id,
                        entity_name,
                        organization_platform_id,
                        manager_email_id,
                        manager_phone_number,
                        address,
                        city,
                        state,
                        post_code,
                        country,
                        is_active,
                        created_at
                    `)
                    .eq('organization_platform_id', organizationPlatformId)
                    .order('created_at', { ascending: false })

                console.log('[EntitiesPage] Hospitals query result:', { count: entitiesData?.length, error: entitiesError })
                
                if (entitiesError) {
                    console.error('[EntitiesPage] Hospitals query error:', entitiesError)
                    throw entitiesError
                }
                
                setEntities(entitiesData || [])
            } catch (err: any) {
                console.error('[EntitiesPage] Error fetching data:', err)
                console.error('[EntitiesPage] Error details:', JSON.stringify(err, null, 2))
                setError(err.message || 'Failed to load data')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [user?.id, organizationPlatformId])

    const handleEdit = (entityPlatformId: string) => {
        router.push(`/organization/${organizationPlatformId}/entities/${entityPlatformId}/edit`)
    }

    const handleToggleActive = async (entityPlatformId: string, currentStatus: boolean) => {
        try {
            const newStatus = !currentStatus
            
            const { data, error } = await supabase
                .schema('master_data')
                .from('hospitals')
                .update({ is_active: newStatus })
                .eq('entity_platform_id', entityPlatformId)
                .select()

            if (error) throw error

            if (!data || data.length === 0) {
                throw new Error('No rows were updated.')
            }

            setEntities(prev =>
                prev.map(entity =>
                    entity.entity_platform_id === entityPlatformId
                        ? { ...entity, is_active: newStatus }
                        : entity
                )
            )
        } catch (err) {
            console.error('Error toggling entity status:', err)
            setError(err instanceof Error ? err.message : 'Failed to update entity status')
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-cyan-100">
                <div className="text-slate-600">Loading...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-cyan-100">
                <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4">
                    <p className="text-sm text-red-700">❌ {error}</p>
                </div>
            </div>
        )
    }

    const activeCount = entities.filter(entity => entity.is_active === true).length
    const inactiveCount = entities.length - activeCount

    return (
        <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-cyan-100 px-6 py-16 text-slate-700">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(167,243,208,0.35),_transparent_55%),_radial-gradient(circle_at_bottom_right,_rgba(103,232,249,0.35),_transparent_45%)]" />

            <div className="relative mx-auto w-full max-w-6xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <button
                            onClick={() => router.push('/organization')}
                            className="mb-2 flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-800"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Organizations
                        </button>
                        <h1 className="text-3xl font-bold text-slate-800">
                            {organization?.organization_name} - Entities
                        </h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Organization ID: {organization?.organization_platform_id}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push(`/organization/${organizationPlatformId}/entities/create`)}
                        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white shadow-lg transition-all hover:bg-emerald-700 hover:shadow-xl"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Create Entity
                    </button>
                </div>

                <div className="rounded-3xl border border-white/70 bg-white/80 px-12 py-8 shadow-2xl backdrop-blur">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-800">
                                    Entities ({entities.length})
                                </h2>
                                {entities.length > 0 && (
                                    <p className="mt-1 text-sm text-slate-600">
                                        {activeCount} active{inactiveCount > 0 ? `, ${inactiveCount} inactive` : ''}
                                    </p>
                                )}
                            </div>
                        </div>

                        {entities.length === 0 ? (
                            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                    <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-slate-800">No Entities</h3>
                                <p className="text-sm text-slate-600">
                                    This organization doesn't have any entities yet.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                                                Entity
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                                                Type
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
                                        {entities.map((entity) => (
                                            <tr key={entity.entity_platform_id} className="transition hover:bg-slate-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500">
                                                            <span className="text-sm font-bold text-white">
                                                                {entity.entity_name?.charAt(0).toUpperCase() || 'H'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-slate-900">
                                                                {entity.entity_name || 'Unnamed Hospital'}
                                                            </div>
                                                            <div className="text-xs text-slate-500">{entity.entity_platform_id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                                                        Hospital
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1 text-sm">
                                                        {entity.manager_email_id && (
                                                            <div className="flex items-center gap-1 text-slate-600">
                                                                <span>📧</span>
                                                                <span>{entity.manager_email_id}</span>
                                                            </div>
                                                        )}
                                                        {entity.manager_phone_number && (
                                                            <div className="flex items-center gap-1 text-slate-600">
                                                                <span>📞</span>
                                                                <span>{entity.manager_phone_number}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {(entity.address || entity.city) && (
                                                        <div className="text-sm text-slate-600">
                                                            {entity.address && <div>{entity.address}</div>}
                                                            {entity.city && (
                                                                <div>
                                                                    {entity.city}{entity.state ? `, ${entity.state}` : ''}{entity.post_code ? ` ${entity.post_code}` : ''}
                                                                </div>
                                                            )}
                                                            {entity.country && <div>{entity.country}</div>}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-block h-2 w-2 rounded-full ${entity.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {entity.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                        <button
                                                            onClick={() => handleToggleActive(entity.entity_platform_id, entity.is_active)}
                                                            className="ml-1 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600"
                                                            title={entity.is_active ? 'Deactivate Hospital' : 'Activate Hospital'}
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
                                                            onClick={() => handleEdit(entity.entity_platform_id)}
                                                            className="rounded-lg bg-slate-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-600"
                                                            title="Edit Entity"
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
                </div>
            </div>
        </div>
    )
}
