"use client"

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

import { useUser } from "@/contexts/UserContext"
import { FurfieldLogo } from "@/components/FurfieldLogo"
import { supabase } from "@/lib/supabase"

export function AppHeader() {
    const router = useRouter()
    const pathname = usePathname()
    const { user, loading, privileges, refreshUser } = useUser()
    
    // Hide header on auth pages
    if (pathname?.startsWith('/auth/')) {
        return null
    }
    const [uploading, setUploading] = useState(false)
    const [menuError, setMenuError] = useState<string | null>(null)
    const [userName, setUserName] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const email = user?.email ?? "guest@furfield.app"
    const displayName = userName || user?.user_metadata?.name || email?.split('@')[0] || "Guest"
    const initials = displayName?.charAt(0)?.toUpperCase() ?? "G"
    const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>
    const avatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url : null
    
    // Get the display name of the highest privilege role
    const roleDisplayName = useMemo(() => {
        if (!privileges?.roles || privileges.roles.length === 0) return null
        const highestRole = privileges.roles.reduce((highest, role) => {
            return role.level < highest.level ? role : highest
        })
        return highestRole.display_name
    }, [privileges])

    // Fetch user's name from profiles
    useEffect(() => {
        async function fetchUserName() {
            if (!user?.id) return
            
            const { data, error } = await supabase
                .schema('master_data')
                .from('profiles')
                .select('first_name, last_name')
                .eq('user_id', user.id)
                .single()
            
            if (data && !error) {
                const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ')
                if (fullName) setUserName(fullName)
            }
        }
        
        fetchUserName()
    }, [user?.id])

    async function handleSignOut() {
        await supabase.auth.signOut()
        router.push('/auth/sign-in')
        router.refresh()
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

            await refreshUser()
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
