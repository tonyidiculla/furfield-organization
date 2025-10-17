'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@furfield/auth-service'

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
    const { user } = useAuth()
    const router = useRouter()
    const params = useParams()
    
    console.log('[EntitiesPage] Component mounted with params:', params)
    console.log('[EntitiesPage] params.id:', params.id)
    console.log('[EntitiesPage] typeof params.id:', typeof params.id)
    
    const organizationPlatformId = params.id as string
    console.log('[EntitiesPage] organizationPlatformId extracted:', organizationPlatformId)
    
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [entities, setEntities] = useState<Entity[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [entityToDelete, setEntityToDelete] = useState<Entity | null>(null)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        let isMounted = true
        
        async function fetchData() {
            if (!organizationPlatformId) {
                console.log('[EntitiesPage] No organization ID provided')
                setLoading(false)
                return
            }

            // Get user ID from AuthProvider or fallback to Supabase session
            let userId: string | undefined = user?.id
            
            if (!userId) {
                console.log('[EntitiesPage] No user from AuthProvider, checking session...')
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    userId = session.user.id
                    console.log('[EntitiesPage] Using session user from Supabase:', session.user.email)
                } else {
                    console.log('[EntitiesPage] No session available yet')
                }
            }
            
            if (!userId) {
                console.log('[EntitiesPage] No user ID available, staying in loading state')
                // Don't set loading to false - keep waiting for auth
                return
            }
            
            if (!isMounted) return

            try {
                setLoading(true)
                setError(null)
                console.log('[EntitiesPage] Starting fetch for user:', userId, 'org:', organizationPlatformId)

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
                console.log('[EntitiesPage] Hospitals data:', entitiesData)
                
                if (entitiesError) {
                    console.error('[EntitiesPage] Hospitals query error:', entitiesError)
                    throw entitiesError
                }
                
                setEntities(entitiesData || [])
                console.log('[EntitiesPage] ✅ Entities state updated with', entitiesData?.length || 0, 'entities')
            } catch (err: any) {
                console.error('[EntitiesPage] Error fetching data:', err)
                console.error('[EntitiesPage] Error details:', JSON.stringify(err, null, 2))
                setError(err.message || 'Failed to load data')
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        fetchData()
        
        return () => {
            isMounted = false
        }
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

    const handleDeleteClick = (entity: Entity) => {
        setEntityToDelete(entity)
        setDeleteConfirmText('')
        setShowDeleteModal(true)
    }

    const handleDeleteConfirm = async () => {
        if (!entityToDelete || deleteConfirmText !== 'delete this entity') {
            return
        }

        try {
            setIsDeleting(true)
            
            // Soft delete by setting deleted_at timestamp
            const { error: deleteError } = await supabase
                .schema('master_data')
                .from('hospitals')
                .update({ 
                    deleted_at: new Date().toISOString(),
                    is_active: false
                })
                .eq('entity_platform_id', entityToDelete.entity_platform_id)

            if (deleteError) {
                throw deleteError
            }

            // Remove from local state
            setEntities(prev => 
                prev.filter(entity => entity.entity_platform_id !== entityToDelete.entity_platform_id)
            )

            // Close modal
            setShowDeleteModal(false)
            setEntityToDelete(null)
            setDeleteConfirmText('')
            
            console.log('✅ Entity deleted successfully')
        } catch (err) {
            console.error('❌ Error deleting entity:', err)
            setError(err instanceof Error ? err.message : 'Failed to delete entity')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDeleteCancel = () => {
        setShowDeleteModal(false)
        setEntityToDelete(null)
        setDeleteConfirmText('')
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

    console.log('[EntitiesPage] Rendering with:', { 
        entitiesCount: entities.length, 
        entities, 
        loading, 
        error,
        organization 
    })

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
                                                            onClick={() => router.push(`/organization/${organizationPlatformId}/entities/${entity.entity_platform_id}/hms`)}
                                                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 flex items-center gap-1"
                                                            title="Launch HMS"
                                                        >
                                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                            HMS
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(entity.entity_platform_id)}
                                                            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                                                            title="Edit Entity"
                                                        >
                                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(entity)}
                                                            className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                                                            title="Delete Entity"
                                                        >
                                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
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

            {/* Delete Confirmation Modal */}
            {showDeleteModal && entityToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                        {/* Header */}
                        <div className="mb-4 flex items-start gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900">Delete Entity</h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    This action cannot be undone. This will permanently delete the entity.
                                </p>
                            </div>
                        </div>

                        {/* Entity Info */}
                        <div className="mb-4 rounded-lg bg-gray-50 p-3">
                            <p className="text-sm font-semibold text-gray-900">
                                {entityToDelete.entity_name || 'Unnamed Hospital'}
                            </p>
                            <p className="text-xs text-gray-600">{entityToDelete.entity_platform_id}</p>
                        </div>

                        {/* Confirmation Input */}
                        <div className="mb-6">
                            <label htmlFor="confirmDelete" className="block text-sm font-medium text-gray-700 mb-2">
                                Please type <span className="font-bold text-red-600">delete this entity</span> to confirm
                            </label>
                            <input
                                id="confirmDelete"
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="delete this entity"
                                autoComplete="off"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteCancel}
                                disabled={isDeleting}
                                className="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleteConfirmText !== 'delete this entity' || isDeleting}
                                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Entity'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
