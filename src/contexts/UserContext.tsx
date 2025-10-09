'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'
import { fetchUserPrivileges } from '@/lib/fetchUserPrivileges'
import type { UserPrivileges } from '@/lib/privileges'

type UserContextValue = {
    user: User | null
    session: Session | null
    loading: boolean
    privileges: UserPrivileges | null
    privilegesLoading: boolean
    refreshUser: () => Promise<void>
    refreshPrivileges: () => Promise<void>
}

const UserContext = createContext<UserContextValue>({
    user: null,
    session: null,
    loading: true,
    privileges: null,
    privilegesLoading: true,
    refreshUser: async () => { },
    refreshPrivileges: async () => { },
})

const REFRESH_INTERVAL = 15 * 60 * 1000 // 15 minutes

console.log('🔵 UserContext module loaded at', new Date().toISOString())

export function UserProvider({ children }: { children: React.ReactNode }) {
    console.log('🟢 UserProvider component rendering')
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [privileges, setPrivileges] = useState<UserPrivileges | null>(null)
    const [privilegesLoading, setPrivilegesLoading] = useState(true)

    const refreshUser = async () => {
        const { data, error } = await supabase.auth.getUser()
        if (error) {
            console.error('Failed to refresh user', error)
            return
        }

        setUser(data.user)
    }

    const refreshPrivileges = async () => {
        if (!user?.id) {
            setPrivileges(null)
            setPrivilegesLoading(false)
            return
        }

        setPrivilegesLoading(true)
        const userPrivileges = await fetchUserPrivileges(user.id)
        setPrivileges(userPrivileges)
        setPrivilegesLoading(false)
    }

    useEffect(() => {
        let refreshTimer: ReturnType<typeof setTimeout> | undefined

        async function loadInitialSession() {
            console.log('[UserContext] Loading initial session...')
            try {
                console.log('[UserContext] Calling supabase.auth.getSession()...')
                const {
                    data: { session: initialSession },
                    error,
                } = await supabase.auth.getSession()

                console.log('[UserContext] getSession() returned')
                if (error) {
                    console.error('[UserContext] Error loading session', error)
                }

                console.log('[UserContext] Session loaded:', initialSession ? 'Yes' : 'No')
                console.log('[UserContext] User ID:', initialSession?.user?.id)
            
                setSession(initialSession)
                setUser(initialSession?.user ?? null)
                setLoading(false)
                console.log('[UserContext] Set user state, loading=false')

                // Fetch privileges directly with the session user ID
                if (initialSession?.user?.id) {
                    console.log('[UserContext] Fetching privileges for user:', initialSession.user.id)
                    setPrivilegesLoading(true)
                    const userPrivileges = await fetchUserPrivileges(initialSession.user.id)
                    console.log('[UserContext] Privileges fetched:', userPrivileges)
                    setPrivileges(userPrivileges)
                    setPrivilegesLoading(false)
                    console.log('[UserContext] Privileges state updated, privilegesLoading=false')
                } else {
                    console.log('[UserContext] No user ID, skipping privilege fetch')
                    setPrivilegesLoading(false)
                }

                scheduleRefresh(initialSession)
            } catch (err) {
                console.error('[UserContext] Exception in loadInitialSession:', err)
                setLoading(false)
                setPrivilegesLoading(false)
            }
        }

        function scheduleRefresh(nextSession: Session | null) {
            if (refreshTimer) {
                clearTimeout(refreshTimer)
            }

            if (!nextSession?.expires_at) return

            const expiration = nextSession.expires_at * 1000
            const reminder = Math.max(expiration - Date.now() - 60_000, 5_000) // refresh 1 min before expiring

            refreshTimer = setTimeout(async () => {
                const { data, error } = await supabase.auth.refreshSession()
                if (error) {
                    console.error('Failed to refresh session', error)
                    setSession(null)
                    setUser(null)
                    return
                }

                setSession(data.session)
                setUser(data.session?.user ?? null)
                scheduleRefresh(data.session)
            }, reminder)
        }

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            console.log('[UserContext] Auth state changed, event:', _event)
            console.log('[UserContext] New session:', newSession ? 'Yes' : 'No')
            console.log('[UserContext] New user ID:', newSession?.user?.id)
            
            setSession(newSession)
            setUser(newSession?.user ?? null)
            setLoading(false)

            // Fetch privileges directly with the session user ID
            if (newSession?.user?.id) {
                console.log('[UserContext] Fetching privileges for user (auth change):', newSession.user.id)
                setPrivilegesLoading(true)
                const userPrivileges = await fetchUserPrivileges(newSession.user.id)
                console.log('[UserContext] Privileges fetched (auth change):', userPrivileges)
                setPrivileges(userPrivileges)
                setPrivilegesLoading(false)
            } else {
                console.log('[UserContext] No user ID (auth change), clearing privileges')
                setPrivileges(null)
                setPrivilegesLoading(false)
            }

            scheduleRefresh(newSession)
        })

        loadInitialSession()

        return () => {
            authListener.subscription.unsubscribe()
            if (refreshTimer) {
                clearTimeout(refreshTimer)
            }
        }
    }, [])

    useEffect(() => {
        const interval = setInterval(async () => {
            const {
                data: { session: currentSession },
            } = await supabase.auth.getSession()

            setSession(currentSession)
            setUser(currentSession?.user ?? null)
        }, REFRESH_INTERVAL)

        return () => clearInterval(interval)
    }, [])

    return (
        <UserContext.Provider
            value={{ user, session, loading, privileges, privilegesLoading, refreshUser, refreshPrivileges }}
        >
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    return useContext(UserContext)
}
