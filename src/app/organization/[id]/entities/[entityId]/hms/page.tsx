'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@furfield/auth-service'

interface Entity {
    entity_platform_id: string
    entity_name: string | null
    organization_platform_id: string | null
    logo_url: string | null
    hospital_type: string | null
    subscribed_modules: any[] | null
    subscription_start_date: string | null
    subscription_end_date: string | null
    subscription_status: string | null
    yearly_subscription_cost: number | null
    is_active: boolean
}

interface Organization {
    organization_id: string
    organization_name: string
    organization_platform_id: string
}

export default function HMSHomePage() {
    const { user } = useAuth()
    const router = useRouter()
    const params = useParams()
    const organizationPlatformId = params.id as string
    const entityPlatformId = params.entityId as string

    const [organization, setOrganization] = useState<Organization | null>(null)
    const [entity, setEntity] = useState<Entity | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            if (!organizationPlatformId || !entityPlatformId) return

            try {
                setLoading(true)

                // Fetch organization
                const { data: orgData, error: orgError } = await supabase
                    .from('organizations')
                    .select('organization_id, organization_name, organization_platform_id')
                    .eq('organization_platform_id', organizationPlatformId)
                    .single()

                if (orgError) throw orgError
                setOrganization(orgData)

                // Fetch entity from master_data schema
                const { data: entityData, error: entityError } = await supabase
                    .schema('master_data')
                    .from('hospitals')
                    .select('*')
                    .eq('entity_platform_id', entityPlatformId)
                    .single()

                if (entityError) throw entityError
                setEntity(entityData)

            } catch (err) {
                console.error('Error fetching data:', err)
                setError('Failed to load HMS data')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [organizationPlatformId, entityPlatformId])

    const handleModuleClick = (moduleId: number, moduleName: string) => {
        // Navigate to the specific module's page
        router.push(`/organization/${organizationPlatformId}/entities/${entityPlatformId}/hms/${moduleName.toLowerCase().replace(/\s+/g, '-')}`)
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getSubscriptionDaysRemaining = () => {
        if (!entity?.subscription_end_date) return null
        const endDate = new Date(entity.subscription_end_date)
        const today = new Date()
        const diffTime = endDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading HMS Dashboard...</p>
                </div>
            </div>
        )
    }

    if (error || !entity) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
                    <p className="text-gray-600 mb-6">{error || 'Entity not found'}</p>
                    <button
                        onClick={() => router.push(`/organization/${organizationPlatformId}/entities`)}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        Back to Entities
                    </button>
                </div>
            </div>
        )
    }

    const subscribedModules = entity.subscribed_modules || [];

    // Temporary: Enable all modules for demonstration purposes
    const allModules = [
        { module_id: 1, module_name: 'Outpatient', module_display_name: 'Outpatient Management' },
        { module_id: 2, module_name: 'Inpatient', module_display_name: 'Inpatient Management' },
        { module_id: 3, module_name: 'Diagnostics', module_display_name: 'Diagnostics' },
        { module_id: 4, module_name: 'Pharmacy', module_display_name: 'Pharmacy Management' },
        { module_id: 5, module_name: 'Billing', module_display_name: 'Billing and Invoicing' },
    ];

    const accessibleModules = subscribedModules.length > 0 ? subscribedModules : allModules;
    const daysRemaining = getSubscriptionDaysRemaining()
    const isSubscriptionActive = daysRemaining && daysRemaining > 0

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
            {/* Header */}
            <div className="bg-white shadow-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {entity.logo_url && (
                                <img 
                                    src={entity.logo_url} 
                                    alt={entity.entity_name || 'Hospital'} 
                                    className="h-16 w-16 rounded-lg object-cover shadow-sm"
                                />
                            )}
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {entity.entity_name || 'Hospital'}
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    {organization?.organization_name}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Subscription Status Badge */}
                            {isSubscriptionActive && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
                                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-emerald-900">Active Subscription</p>
                                            <p className="text-xs text-emerald-700">
                                                {daysRemaining} days remaining • Expires {formatDate(entity.subscription_end_date)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => router.push(`/organization/${organizationPlatformId}/entities/${entityPlatformId}/edit`)}
                                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Settings
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {accessibleModules.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <div className="text-gray-400 text-6xl mb-4">📦</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Modules Subscribed</h2>
                        <p className="text-gray-600 mb-6">
                            Get started by subscribing to HMS modules to unlock powerful features for your hospital.
                        </p>
                        <button
                            onClick={() => router.push(`/organization/${organizationPlatformId}/entities/${entityPlatformId}/edit`)}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                        >
                            Subscribe to Modules
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your HMS Modules</h2>
                            <p className="text-gray-600">
                                Click on any module to access its features and functionality
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {accessibleModules.map((module: any) => (
                                <div
                                    key={module.module_id}
                                    onClick={() => handleModuleClick(module.module_id, module.module_name)}
                                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-200 hover:border-emerald-400 overflow-hidden"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg group-hover:scale-110 transition-transform">
                                                <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                </svg>
                                            </div>
                                            <span className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full">
                                                Active
                                            </span>
                                        </div>
                                        
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                                            {module.module_display_name || module.module_name}
                                        </h3>
                                        
                                        {module.subscribed_at && (
                                            <p className="text-xs text-gray-500 mb-3">
                                                Subscribed: {formatDate(module.subscribed_at)}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                                            <div className="flex items-center text-emerald-600 group-hover:translate-x-1 transition-transform">
                                                <span className="text-sm font-medium mr-1">Launch</span>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick Actions */}
                        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    onClick={() => router.push(`/organization/${organizationPlatformId}/entities/${entityPlatformId}/edit`)}
                                    className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-all"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900">Add Modules</p>
                                        <p className="text-xs text-gray-500">Subscribe to more features</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => router.push(`/organization/${organizationPlatformId}/entities/${entityPlatformId}/edit`)}
                                    className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-all"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900">Edit Hospital</p>
                                        <p className="text-xs text-gray-500">Update hospital information</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => router.push(`/organization/${organizationPlatformId}/entities`)}
                                    className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-all"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                                        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900">All Entities</p>
                                        <p className="text-xs text-gray-500">View all hospitals</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
