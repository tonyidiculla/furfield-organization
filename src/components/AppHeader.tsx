"use client"

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

import { useAuth } from "@furfield/auth-service"
import { FurfieldLogo } from "@/components/FurfieldLogo"
import { createClient } from "@/lib/supabase"

export function AppHeader() {
    const router = useRouter()
    const pathname = usePathname()
    const { user, loading, signOut, refreshSession } = useAuth()
    const supabase = useMemo(() => createClient(), [])
    const [uploading, setUploading] = useState(false)
    const [menuError, setMenuError] = useState<string | null>(null)
    const [userName, setUserName] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [userAvatar, setUserAvatar] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    // Get privileges from user object
    const privileges = user?.privileges
    
    // Hide header on auth pages (AFTER all hooks are defined)
    if (pathname?.startsWith('/auth/')) {
        return null
    }

    // Helper function to capitalize names properly
    const capitalizeName = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
    }

    const email = user?.email ?? "guest@furfield.app"
    const rawDisplayName = userName || user?.user_metadata?.name || email?.split('@')[0] || "Guest"
    const displayName = capitalizeName(rawDisplayName)
    const initials = displayName
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>
    const avatarUrl = userAvatar || (typeof metadata.avatar_url === "string" ? metadata.avatar_url : null)
    
    // Get the display name of the highest privilege role
    const roleDisplayName = useMemo(() => {
        // Use the role fetched from database first
        if (userRole) return userRole
        
        // Fallback to privileges from user object (if available)
        // Note: This is a fallback and may not have display_name
        if (!privileges?.roles || privileges.roles.length === 0) return null
        
        // Since PlatformRole interface doesn't have level/display_name in TypeScript
        // but database does have them, we use type assertion
        const rolesWithLevel = privileges.roles as any[]
        if (rolesWithLevel.length === 0) return null
        
        const highestRole = rolesWithLevel.reduce((highest, role) => {
            const highestLevel = typeof highest.privilege_level === 'number' ? highest.privilege_level : 999
            const roleLevel = typeof role.privilege_level === 'number' ? role.privilege_level : 999
            return roleLevel < highestLevel ? role : highest
        })
        
        return highestRole.display_name || highestRole.role_name
    }, [privileges, userRole])

    // Fetch complete user profile from database
    useEffect(() => {
        async function fetchUserProfile() {
            // Try to get user from AuthProvider first, fallback to Supabase session if not available
            let userId: string | undefined = user?.id
            let userEmail: string | undefined = user?.email
            let userMetadata: Record<string, unknown> | undefined = user?.user_metadata as Record<string, unknown> | undefined
            
            if (!userId) {
                // Fallback: Check if there's a session in Supabase directly
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    userId = session.user.id
                    userEmail = session.user.email
                    userMetadata = session.user.user_metadata as Record<string, unknown>
                    console.log('📥 Using session user from Supabase directly:', userEmail)
                } else {
                    return
                }
            }

            try {
                console.log('📥 Fetching user profile for:', userEmail)
                
                // Also set avatar from user metadata if available
                if (userMetadata?.avatar_url && typeof userMetadata.avatar_url === 'string') {
                    setUserAvatar(userMetadata.avatar_url)
                    console.log('✅ Avatar loaded from metadata:', userMetadata.avatar_url)
                }
                
                const { data: profile, error: profileError } = await supabase
                    .schema('master_data')
                    .from('profiles')
                    .select('first_name, last_name, user_platform_id')
                    .eq('user_id', userId)
                    .single()

                if (profileError) {
                    console.error('❌ Error fetching user profile:', profileError)
                    return
                }

                if (profile) {
                    console.log('✅ Profile fetched:', profile)
                    
                    // Combine first_name + last_name
                    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                    if (fullName) {
                        setUserName(fullName)
                        console.log('✅ Display name set to:', fullName)
                    }

                    // Note: Avatar is loaded from user.user_metadata.avatar_url (set during upload)

                    // Fetch user's actual role
                    if (profile.user_platform_id) {
                        const userPlatformId = profile.user_platform_id
                        
                        // Get role assignments
                        const { data: roleAssignments, error: roleError } = await supabase
                            .schema('master_data')
                            .from('user_to_role_assignment')
                            .select('platform_role_id')
                            .eq('user_platform_id', userPlatformId)

                        if (roleError || !roleAssignments || roleAssignments.length === 0) {
                            console.log('⚠️ No role assignments found')
                            return
                        }

                        // Get role details with display_name
                        const roleIds = roleAssignments.map((r: { platform_role_id: number }) => r.platform_role_id)
                        const { data: roles, error: rolesError } = await supabase
                            .schema('master_data')
                            .from('platform_roles')
                            .select('role_name, display_name, privilege_level')
                            .in('id', roleIds)
                            .order('privilege_level', { ascending: true })

                        if (rolesError || !roles || roles.length === 0) {
                            console.log('⚠️ Could not fetch role details')
                            return
                        }

                        // Use the role with highest privilege (lowest number)
                        const primaryRole = roles[0]
                        const roleDisplay = primaryRole.display_name || primaryRole.role_name
                        setUserRole(roleDisplay)
                        console.log('✅ Role set to:', roleDisplay)
                    }
                }
            } catch (error) {
                console.error('❌ Exception fetching user profile:', error)
            }
        }

        fetchUserProfile()
    }, [user?.id, loading, supabase]) // Re-run when user or Supabase client context changes

    async function handleSignOut() {
        try {
            // 1. Sign out from Supabase (clears auth cookies)
            await signOut()

            const { error: supabaseSignOutError } = await supabase.auth.signOut()
            if (supabaseSignOutError) {
                console.warn('Supabase client sign-out warning:', supabaseSignOutError)
            }
            
            // 2. Clear all localStorage (removes any cached tokens)
            localStorage.clear()
            
            // 3. Clear sessionStorage as well
            sessionStorage.clear()

            // 4. Notify other tabs/windows about the logout
            window.dispatchEvent(new Event('storage'))
            
            // 5. Redirect to auth service with cache-busting timestamp
            // This prevents browser from using cached login page
            window.location.href = `http://localhost:8000?t=${Date.now()}`
        } catch (error) {
            console.error('Error during sign out:', error)
            try {
                const { error: supabaseSignOutError } = await supabase.auth.signOut()
                if (supabaseSignOutError) {
                    console.warn('Supabase client sign-out warning during fallback:', supabaseSignOutError)
                }
            } catch (signOutError) {
                console.error('Failed to force Supabase sign-out during fallback:', signOutError)
            }
            // Force redirect even if there's an error
            localStorage.clear()
            sessionStorage.clear()
            window.dispatchEvent(new Event('storage'))
            window.location.href = `http://localhost:8000?t=${Date.now()}`
        }
    }

    function handleAvatarClick() {
        if (uploading) {
            return
        }

        setMenuError(null)
        fileInputRef.current?.click()
    }

    async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file || !user) {
            event.target.value = ''
            return
        }

        setUploading(true)
        setMenuError(null)

        try {
            const fileExt = file.name.split('.').pop() ?? 'png'
            const filePath = `${user.id}/${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage.from('profile-icons').upload(filePath, file, {
                upsert: true,
                cacheControl: '3600',
            })

            if (uploadError) {
                throw uploadError
            }

            const {
                data: { publicUrl },
            } = supabase.storage.from('profile-icons').getPublicUrl(filePath)

            const uploadedAt = new Date().toISOString()
            const iconStoragePayload = {
                bucket: 'profile-icons',
                path: filePath,
                public_url: publicUrl,
                uploaded_at: uploadedAt,
            }

            const { error: profileError, data: profileRow } = await supabase
                .schema('master_data')
                .from('profiles')
                .update({ icon_storage: iconStoragePayload, updated_at: uploadedAt })
                .eq('user_id', user.id)
                .select('id')
                .maybeSingle()

            if (profileError) {
                throw profileError
            }

            if (!profileRow?.id) {
                throw new Error('No matching profile found to update icon storage. Please contact support.')
            }

            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl },
            })

            if (updateError) {
                throw updateError
            }

            // Also update the profile_pic_url field for consistency
            const { error: picError } = await supabase
                .schema('master_data')
                .from('profiles')
                .update({ profile_pic_url: publicUrl })
                .eq('user_id', user.id)

            if (picError) {
                console.error('⚠️ Could not update profile_pic_url:', picError)
                // Don't throw - main update succeeded
            }

            // Update local state immediately
            setUserAvatar(publicUrl)
            console.log('✅ Avatar uploaded and updated:', publicUrl)

            // Refresh the session to get updated user metadata
            await refreshSession()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to upload avatar. Please try again.'
            setMenuError(message)
        } finally {
            setUploading(false)
            event.target.value = ''
        }
    }

    return (
        <header className="relative z-10 w-full bg-white/90 shadow-sm backdrop-blur">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-200/40 via-white to-amber-200/40" aria-hidden="true" />

            <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
                <Link href="/organization" className="flex items-center gap-3 text-lg font-semibold text-slate-800">
                    <FurfieldLogo className="rounded-full" size={52} />
                    <span className="hidden sm:inline tracking-wide">FURFIELD Organization Management</span>
                </Link>

                <nav className="flex items-center gap-3 sm:gap-4">
                    <button
                        onClick={() => {
                            console.log('[AppHeader] Home button clicked, navigating to /organization')
                            router.push('/organization')
                        }}
                        className="rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-sky-300 transition"
                    >
                        Home
                    </button>

                    <div className="relative flex flex-col items-end">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />

                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={handleAvatarClick}
                                className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white/80 text-sm font-semibold text-slate-600 shadow transition hover:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-70"
                                aria-label={uploading ? 'Uploading profile image' : 'Upload profile image'}
                                disabled={uploading}
                            >
                                {avatarUrl ? (
                                    <Image
                                        src={avatarUrl}
                                        alt="Profile avatar"
                                        width={40}
                                        height={40}
                                        className="h-10 w-10 rounded-full object-cover"
                                        style={{ width: 'auto', height: 'auto' }}
                                        unoptimized
                                    />
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-sky-500 to-emerald-500 text-base font-semibold text-white shadow-inner">
                                        {initials}
                                    </div>
                                )}
                                {uploading ? (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                        ...
                                    </div>
                                ) : null}
                            </button>

                            <div className="flex items-center gap-2 px-3 py-1.5">
                                <div className="hidden text-sm text-slate-600 sm:flex sm:flex-col">
                                    <span className="font-medium text-slate-700">
                                        {loading ? 'Loading…' : displayName}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {roleDisplayName || 'Loading...'}
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-slate-700 sm:hidden">
                                    {loading ? 'Loading…' : displayName}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={handleSignOut}
                                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-300"
                                title="Sign out"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                </svg>
                            </button>
                        </div>

                        {menuError ? (
                            <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-500 shadow-sm">
                                {menuError}
                            </p>
                        ) : null}
                    </div>
                </nav>
            </div>
        </header>
    )
}
