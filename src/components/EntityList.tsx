'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@furfield/auth-service'

interface Entity {
    entity_id: string
    entity_platform_id: string
    entity_name: string
    entity_type: string
    organization_id: string
    organization_name?: string
    email?: string
    phone?: string
    city?: string
    state?: string
    country?: string
    is_active: string
    logo_storage?: {
        url: string
    }
    created_at: string
}

export function EntityList() {
    const { user } = useAuth()
    const router = useRouter()
    const [entities, setEntities] = useState<Entity[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchEntities() {
            // Try to get user from AuthProvider first, fallback to Supabase session if not available
            let userId: string | undefined = user?.id
            
            if (!userId) {
                // Fallback: Check if there's a session in Supabase directly
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    userId = session.user.id
                    console.log('[EntityList] Using session user from Supabase:', session.user.email)
                } else {
                    setLoading(false)
                    return
                }
            }

            try {
                setLoading(true)
                setError(null)

                // First, get user's platform_id
                const { data: profile, error: profileError } = await supabase
                    .schema('master_data')
                    .from('profiles')
                    .select('user_platform_id')
                    .eq('user_id', userId)
                    .single()

                if (profileError || !profile?.user_platform_id) {
                    throw new Error('Could not find user profile')
                }

                const userPlatformId = profile.user_platform_id
                console.log('[EntityList] User platform ID:', userPlatformId)

                // Get user's organizations
                const { data: organizations, error: orgError } = await supabase
                    .schema('master_data')
                    .from('organizations')
                    .select('organization_platform_id')
                    .eq('owner_platform_id', userPlatformId)
                    .is('deleted_at', null)

                if (orgError) {
                    throw orgError
                }

                if (!organizations || organizations.length === 0) {
                    console.log('[EntityList] No organizations found for user')
                    setEntities([])
                    return
                }

                const orgPlatformIds = organizations.map(org => org.organization_platform_id)
                console.log('[EntityList] User owns', orgPlatformIds.length, 'organization(s)')

                // Fetch entities with organization info
                console.log('[EntityList] Fetching entities for user organizations...')
                const { data: entitiesData, error: entitiesError } = await supabase
                    .schema('master_data')
                    .from('global_organization_entity')
                    .select(`
                        entity_id,
                        entity_platform_id,
                        entity_name,
                        entity_type,
                        organization_id,
                        email,
                        phone,
                        city,
                        state,
                        country,
                        is_active,
                        created_at
                    `)
                    .in('organization_id', orgPlatformIds)
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false })

                console.log('[EntityList] Query result:', { entitiesData, entitiesError })

                if (entitiesError) {
                    throw entitiesError
                }

                console.log('[EntityList] Found entities:', entitiesData?.length || 0)
                setEntities(entitiesData || [])
            } catch (err: any) {
                console.error('Error fetching entities:', err)
                setError(err.message || 'Failed to load entities')
            } finally {
                setLoading(false)
            }
        }

        fetchEntities()
    }, [user?.id])

    const handleEdit = (entityId: string) => {
        router.push(`/entity/${entityId}/edit`)
    }

    const handleToggleActive = async (entityId: string, currentStatus: string) => {
        try {
            console.log('[handleToggleActive] Starting status toggle:', { entityId, currentStatus })
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
            
            const { data, error } = await supabase
                .schema('master_data')
                .from('global_organization_entity')
                .update({ is_active: newStatus })
                .eq('entity_id', entityId)
                .select()

            console.log('[handleToggleActive] Update result:', { data, error })

            if (error) {
                console.error('[handleToggleActive] Error details:', error)
                throw error
            }

            if (!data || data.length === 0) {
                throw new Error('No rows were updated. This might be an RLS policy issue.')
            }

            // Update local state
            setEntities(prev =>
                prev.map(entity =>
                    entity.entity_id === entityId
                        ? { ...entity, is_active: newStatus }
                        : entity
                )
            )

            console.log(`✅ Entity status updated to: ${newStatus}`)
        } catch (err) {
            console.error('❌ Error toggling entity status:', err)
            setError(err instanceof Error ? err.message : 'Failed to update entity status')
        }
    }

    if (loading) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center">
                <div className="text-slate-600">Loading entities...</div>
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

    console.log('[EntityList] Rendering with entities:', entities.length, entities)

    const activeCount = entities.filter(entity => entity.is_active === 'active').length
    const inactiveCount = entities.length - activeCount

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                        Your Entities ({entities.length})
                    </h2>
                    {entities.length > 0 && (
                        <p className="mt-1 text-sm text-slate-600">
                            {activeCount} active{inactiveCount > 0 ? `, ${inactiveCount} inactive` : ''}
                        </p>
                    )}
                </div>
                <button
                    onClick={() => router.push('/entity/create')}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white shadow-lg transition-all hover:bg-emerald-700 hover:shadow-xl"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Entity
                </button>
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
                        You don't have any entities yet.
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
                                <tr key={entity.entity_id} className="transition hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {entity.logo_storage?.url ? (
                                                <img 
                                                    src={entity.logo_storage.url} 
                                                    alt={entity.entity_name} 
                                                    className="h-10 w-10 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500">
                                                    <span className="text-sm font-bold text-white">
                                                        {entity.entity_name?.charAt(0).toUpperCase() || 'E'}
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-slate-900">
                                                    {entity.entity_name || 'Unnamed Entity'}
                                                </div>
                                                <div className="text-xs text-slate-500">{entity.entity_platform_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                                            {entity.entity_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1 text-sm">
                                            {entity.email && (
                                                <div className="flex items-center gap-1 text-slate-600">
                                                    <span>📧</span>
                                                    <span>{entity.email}</span>
                                                </div>
                                            )}
                                            {entity.phone && (
                                                <div className="flex items-center gap-1 text-slate-600">
                                                    <span>📞</span>
                                                    <span>{entity.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {entity.city && (
                                            <div className="text-sm text-slate-600">
                                                {entity.city}{entity.state ? `, ${entity.state}` : ''}{entity.country ? `, ${entity.country}` : ''}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-block h-2 w-2 rounded-full ${entity.is_active === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                            <span className="text-sm font-medium text-slate-700">
                                                {entity.is_active === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                            <button
                                                onClick={() => handleToggleActive(entity.entity_id, entity.is_active)}
                                                className="ml-1 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600"
                                                title={entity.is_active === 'active' ? 'Deactivate Entity' : 'Activate Entity'}
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
                                                onClick={() => handleEdit(entity.entity_id)}
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
    )
}
