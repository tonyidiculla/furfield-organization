'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export interface UserSearchResult {
    user_id: string
    user_platform_id: string
    first_name: string
    last_name: string
    email: string
    full_name: string // Computed
}

interface UserSearchProps {
    onSelect: (user: UserSearchResult) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    selectedUserId?: string
}

export default function UserSearch({
    onSelect,
    placeholder = 'Search by name, email, or Platform ID...',
    className = '',
    disabled = false,
    selectedUserId
}: UserSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<UserSearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Load selected user if selectedUserId is provided
    useEffect(() => {
        async function loadSelectedUser() {
            if (!selectedUserId) {
                setSelectedUser(null)
                setQuery('')
                return
            }

            try {
                const { data, error } = await supabase
                    .schema('master_data')
                    .from('profiles')
                    .select('user_id, user_platform_id, first_name, last_name, email')
                    .eq('user_id', selectedUserId)
                    .single()

                if (error) throw error

                const user: UserSearchResult = {
                    ...data,
                    full_name: `${data.first_name} ${data.last_name}`.trim()
                }

                setSelectedUser(user)
                setQuery(`${user.full_name} (${user.user_platform_id})`)
            } catch (err) {
                console.error('Error loading selected user:', err)
            }
        }

        loadSelectedUser()
    }, [selectedUserId])

    // Real-time search
    useEffect(() => {
        async function searchUsers() {
            if (!query || query.length < 2) {
                setResults([])
                return
            }

            // Don't search if we already have a selected user (prevents searching for formatted display string)
            if (selectedUser && query === `${selectedUser.full_name} (${selectedUser.user_platform_id})`) {
                setResults([])
                return
            }

            try {
                setLoading(true)

                const { data, error } = await supabase
                    .schema('master_data')
                    .from('profiles')
                    .select('user_id, user_platform_id, first_name, last_name, email')
                    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,user_platform_id.ilike.%${query}%`)
                    .limit(10)

                if (error) throw error

                const users: UserSearchResult[] = (data || []).map(user => ({
                    ...user,
                    full_name: `${user.first_name} ${user.last_name}`.trim()
                }))

                setResults(users)
                setShowDropdown(true)
            } catch (err) {
                console.error('Error searching users:', err)
                setResults([])
            } finally {
                setLoading(false)
            }
        }

        const debounce = setTimeout(() => {
            searchUsers()
        }, 300) // 300ms debounce

        return () => clearTimeout(debounce)
    }, [query, selectedUser])

    const handleSelect = (user: UserSearchResult) => {
        setSelectedUser(user)
        setQuery(`${user.full_name} (${user.user_platform_id})`)
        setShowDropdown(false)
        onSelect(user)
    }

    const handleClear = () => {
        setSelectedUser(null)
        setQuery('')
        setResults([])
        setShowDropdown(false)
    }

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        if (!e.target.value) {
                            handleClear()
                        }
                    }}
                    onFocus={() => query && setShowDropdown(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 pr-10 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
                
                {/* Clear button */}
                {query && !disabled && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                {/* Loading indicator */}
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500"></div>
                    </div>
                )}
            </div>

            {/* Dropdown results */}
            {showDropdown && results.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {results.map((user, index) => (
                        <button
                            key={user.user_id || user.user_platform_id || `user-${index}`}
                            type="button"
                            onClick={() => handleSelect(user)}
                            className="w-full border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-sky-50 last:border-b-0"
                        >
                            <div className="font-medium text-slate-900">{user.full_name}</div>
                            <div className="mt-0.5 text-sm text-slate-600">{user.email}</div>
                            <div className="mt-0.5 text-xs font-mono text-slate-500">{user.user_platform_id}</div>
                        </button>
                    ))}
                </div>
            )}

            {/* No results message */}
            {showDropdown && !loading && query.length >= 2 && results.length === 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg">
                    <p className="text-sm text-slate-600">No users found matching "{query}"</p>
                </div>
            )}
        </div>
    )
}
