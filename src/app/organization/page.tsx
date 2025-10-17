'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@furfield/auth-service'
import { supabase } from '@/lib/supabase'
import { OrganizationList } from '@/components/OrganizationList'
import { OrganizationPrivilegesBadge } from '@/components/OrganizationPrivilegesBadge'

export default function OrganizationPage() {
    const { user, loading: authLoading } = useAuth()
    const [authChecking, setAuthChecking] = useState(true)
    const [authorized, setAuthorized] = useState(false)
    const [authError, setAuthError] = useState<string | null>(null)

    // ADD: bounded retry while tokens exist and user is null
    const [retryAttempts, setRetryAttempts] = useState(0)
    const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Debug: Log whenever user or authLoading changes
    useEffect(() => {
        console.log('🔄 [Organization] Auth state changed:', { 
            authLoading, 
            user: user ? { id: user.id, email: user.email } : null 
        })
    }, [user, authLoading])

    // Authorization check: Verify user has organization access (privilege ≤ 20)
    useEffect(() => {
        let mounted = true
        let recheckTimeout: NodeJS.Timeout | null = null
        
        const checkAuthorization = async () => {
            // Wait for auth to finish loading
            if (authLoading) {
                console.log('⏳ [Organization] Waiting for auth to finish loading...')
                return
            }
            
            if (!mounted) return
            
            console.log('🔍 [Organization] Starting authorization check...')
            console.log('🔍 [Organization] Auth state:', { authLoading, user: user ? user.email : null, userId: user?.id, retryAttempts })
            
            // Get user ID from AuthProvider or fallback to Supabase session
            let userId = user?.id
            
            if (!userId) {
                console.log('🔍 [Organization] No user from AuthProvider yet')
                const hasTokens = typeof window !== 'undefined' && window.location.search.includes('access_token')
                console.log('⏳ [Organization] URL has tokens?', hasTokens)
                
                // CHANGED: bounded retry instead of returning indefinitely
                if (hasTokens && retryAttempts < 15) {
                    const next = retryAttempts + 1
                    console.log(`⏳ [Organization] Tokens detected, retry ${next}/15, waiting 500ms...`)
                    if (retryTimer.current) clearTimeout(retryTimer.current)
                    retryTimer.current = setTimeout(() => {
                        if (mounted) setRetryAttempts(prev => prev + 1)
                    }, 500)
                    setAuthChecking(true)
                    return
                }

                if (hasTokens && retryAttempts >= 15) {
                    console.error('❌ [Organization] Session restoration timed out after retries')
                    if (mounted) {
                        setAuthError('Session restoration timed out. Please sign in again.')
                        setAuthChecking(false)
                    }
                    return
                }
                
                // No user and no tokens - authentication failed
                console.error('❌ [Organization] No user available and no tokens in URL')
                if (mounted) {
                    setAuthError('Authentication required. Please sign in again.')
                    setAuthChecking(false)
                }
                return
            }
            
            // Got user: clear retry timer and reset attempts
            if (retryTimer.current) {
                clearTimeout(retryTimer.current)
                retryTimer.current = null
            }
            if (retryAttempts > 0) setRetryAttempts(0)

            if (!mounted) return
            console.log('✅ [Organization] User authenticated:', userId)
            
            try {
                // 2. Get user's platform_id from profiles
                const { data: profile, error: profileError} = await supabase
                    .schema('master_data')
                    .from('profiles')
                    .select('user_platform_id')
                    .eq('user_id', userId)
                    .single()

                if (profileError || !profile) {
                    console.error('❌ Could not find user profile:', profileError)
                    setAuthError('Could not verify user profile')
                    setAuthChecking(false)
                    return
                }

                const userPlatformId = profile.user_platform_id
                console.log('✅ User platform ID:', userPlatformId)

                // 3. Get user's role assignments
                const { data: roleAssignments, error: roleError } = await supabase
                    .schema('master_data')
                    .from('user_to_role_assignment')
                    .select('platform_role_id')
                    .eq('user_platform_id', userPlatformId)

                if (roleError || !roleAssignments || roleAssignments.length === 0) {
                    console.error('❌ No role assignments found:', roleError)
                    setAuthError('No role assignments found for this user')
                    setAuthChecking(false)
                    return
                }

                console.log('✅ Role assignments:', roleAssignments)

                // 4. Get privilege levels for assigned roles
                const roleIds = roleAssignments.map((r: any) => r.platform_role_id)
                const { data: roles, error: privilegeError } = await supabase
                    .schema('master_data')
                    .from('platform_roles')
                    .select('privilege_level')
                    .in('id', roleIds)

                if (privilegeError || !roles || roles.length === 0) {
                    console.error('❌ Could not fetch privilege levels:', privilegeError)
                    setAuthError('Could not verify privilege levels')
                    setAuthChecking(false)
                    return
                }

                console.log('✅ Privilege levels:', roles)

                // 5. Check if user has organization access (≤ 20)
                const privilegeLevels = roles.map((r: any) => r.privilege_level)
                const minPrivilege = Math.min(...privilegeLevels)

                console.log('✅ [Organization] Minimum privilege level:', minPrivilege)

                if (minPrivilege > 20) {
                    console.log('❌ [Organization] Insufficient privileges')
                    if (mounted) {
                        setAuthError('You do not have Organization access privileges')
                        setAuthChecking(false)
                    }
                    return
                }

                console.log('✅ [Organization] Authorization successful - access granted')
                if (mounted) {
                    setAuthorized(true)
                    setAuthChecking(false)
                }

            } catch (error) {
                console.error('❌ [Organization] Authorization check failed:', error)
                if (mounted) {
                    setAuthError('An error occurred during authorization')
                    setAuthChecking(false)
                }
            }
        }

        // Listen for storage events (triggered by SessionRestorer)
        const handleStorageEvent = () => {
            console.log('📢 [Organization] Storage event detected, re-checking authorization...')
            // Small delay to ensure session is fully set
            recheckTimeout = setTimeout(() => {
                checkAuthorization()
            }, 100)
        }
        
        window.addEventListener('storage', handleStorageEvent)
        checkAuthorization()
        
        return () => {
            mounted = false
            window.removeEventListener('storage', handleStorageEvent)
            if (recheckTimeout) {
                clearTimeout(recheckTimeout)
            }
            if (retryTimer.current) {
                clearTimeout(retryTimer.current)
                retryTimer.current = null
            }
        }
    }, [authLoading, user, retryAttempts]) // Re-run when user or retryAttempts change

    // Show loading state while checking authorization
    if (authChecking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600">Verifying authorization...</p>
                </div>
            </div>
        )
    }

    // Show error if authorization failed
    if (!authorized) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-100 via-slate-100/60 to-orange-100/40 flex items-center justify-center px-4">
                <div className="max-w-md w-full">
                    <div className="rounded-3xl border border-red-200 bg-white/80 shadow-2xl backdrop-blur p-8">
                        <div className="text-center">
                            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-red-900 mb-2">Access Denied</h2>
                            <p className="text-base text-gray-600 mb-4">
                                {authError || 'You do not have permission to access the Organization portal'}
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                Organization access requires privilege level 20 or lower.
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => window.location.href = 'http://localhost:8000'}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Back to Login
                                </button>
                                <button 
                                    onClick={() => window.location.href = 'http://localhost:5001'}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Go to HMS
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

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