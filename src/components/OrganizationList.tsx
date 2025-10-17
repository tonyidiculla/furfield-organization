'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@furfield/auth-service'
import type { Organization } from '@/types/organization'

export function OrganizationList() {
    const { user } = useAuth()
    const router = useRouter()
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [userPlatformId, setUserPlatformId] = useState<string | null>(null)
    const [hasFetched, setHasFetched] = useState(false)
    
    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [organizationToDelete, setOrganizationToDelete] = useState<Organization | null>(null)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        async function fetchOrganizations() {
            // Try to get user from AuthProvider first, fallback to Supabase session if not available
            let userId: string | undefined = user?.id
            
            if (!userId) {
                // Fallback: Check if there's a session in Supabase directly
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    userId = session.user.id
                    console.log('[OrganizationList] Using session user from Supabase:', session.user.email)
                } else {
                    setLoading(false)
                    return
                }
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
                    .eq('user_id', userId)
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

    const handleDeleteClick = (org: Organization) => {
        setOrganizationToDelete(org)
        setDeleteConfirmText('')
        setShowDeleteModal(true)
    }

    const handleDeleteConfirm = async () => {
        if (!organizationToDelete || deleteConfirmText !== 'delete this organization') {
            return
        }

        try {
            setIsDeleting(true)
            
            // Soft delete by setting deleted_at timestamp
            const { error: deleteError } = await supabase
                .schema('master_data')
                .from('organizations')
                .update({ 
                    deleted_at: new Date().toISOString(),
                    is_active: 'inactive'
                })
                .eq('organization_id', organizationToDelete.organization_id)

            if (deleteError) {
                throw deleteError
            }

            // Remove from local state
            setOrganizations(prev => 
                prev.filter(org => org.organization_id !== organizationToDelete.organization_id)
            )

            // Close modal
            setShowDeleteModal(false)
            setOrganizationToDelete(null)
            setDeleteConfirmText('')
            
            console.log('✅ Organization deleted successfully')
        } catch (err) {
            console.error('❌ Error deleting organization:', err)
            setError(err instanceof Error ? err.message : 'Failed to delete organization')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDeleteCancel = () => {
        setShowDeleteModal(false)
        setOrganizationToDelete(null)
        setDeleteConfirmText('')
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
                                                    className="h-10 w-10 rounded-lg object-contain"
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
                                                className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sky-700 flex items-center gap-1"
                                                title="Go to Entities"
                                            >
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Entities
                                            </button>
                                            <button
                                                onClick={() => handleEdit(org.organization_id)}
                                                className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                                                title="Edit Organization"
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(org)}
                                                className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                                                title="Delete Organization"
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

            {/* Delete Confirmation Modal */}
            {showDeleteModal && organizationToDelete && (
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
                                <h3 className="text-lg font-bold text-gray-900">Delete Organization</h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    This action cannot be undone. This will permanently delete the organization.
                                </p>
                            </div>
                        </div>

                        {/* Organization Info */}
                        <div className="mb-4 rounded-lg bg-gray-50 p-3">
                            <p className="text-sm font-semibold text-gray-900">
                                {organizationToDelete.organization_name}
                            </p>
                            {organizationToDelete.brand_name && (
                                <p className="text-xs text-gray-600">{organizationToDelete.brand_name}</p>
                            )}
                        </div>

                        {/* Confirmation Input */}
                        <div className="mb-6">
                            <label htmlFor="confirmDelete" className="block text-sm font-medium text-gray-700 mb-2">
                                Please type <span className="font-bold text-red-600">delete this organization</span> to confirm
                            </label>
                            <input
                                id="confirmDelete"
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="delete this organization"
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
                                disabled={deleteConfirmText !== 'delete this organization' || isDeleting}
                                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Organization'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
