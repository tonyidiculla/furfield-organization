'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestPrivilegesPage() {
    const [step, setStep] = useState(1)
    const [results, setResults] = useState<any>({})
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        testPrivilegeChain()
    }, [])

    async function testPrivilegeChain() {
        try {
            // Step 1: Get current user
            setStep(1)
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            
            if (userError) throw new Error(`Auth error: ${userError.message}`)
            if (!user) throw new Error('No user logged in')
            
            setResults((prev: any) => ({ ...prev, user: user.id, email: user.email }))
            
            // Step 2: Get profile
            setStep(2)
            const { data: profile, error: profileError } = await supabase
                .schema('master_data')
                .from('profiles')
                .select('user_platform_id')
                .eq('user_id', user.id)
                .single()
            
            if (profileError) throw new Error(`Profile error: ${profileError.message}`)
            if (!profile) throw new Error('No profile found')
            
            setResults((prev: any) => ({ ...prev, profile: profile.user_platform_id }))
            
            // Step 3: Get assignments
            setStep(3)
            const { data: assignments, error: assignError } = await supabase
                .schema('master_data')
                .from('user_to_role_assignment')
                .select('*')
                .eq('user_platform_id', profile.user_platform_id)
                .eq('is_active', true)
            
            if (assignError) throw new Error(`Assignment error: ${assignError.message}`)
            
            setResults((prev: any) => ({ ...prev, assignments: assignments?.length || 0 }))
            
            // Step 4: Get roles
            if (assignments && assignments.length > 0) {
                setStep(4)
                const roleIds = assignments.map(a => a.platform_role_id)
                
                const { data: roles, error: rolesError } = await supabase
                    .schema('master_data')
                    .from('platform_roles')
                    .select('*')
                    .in('id', roleIds)
                
                if (rolesError) throw new Error(`Roles error: ${rolesError.message}`)
                
                setResults((prev: any) => ({ 
                    ...prev, 
                    roles: roles?.map(r => r.role_name).join(', ') || 'none'
                }))
            }
            
            setStep(5)
        } catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Privilege System Test</h1>
            
            <div className="space-y-4">
                <div className={`p-4 rounded ${step >= 1 ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <div className="font-bold">Step 1: Get Auth User</div>
                    {results.user && (
                        <div className="text-sm mt-2">
                            <div>User ID: {results.user}</div>
                            <div>Email: {results.email}</div>
                        </div>
                    )}
                </div>

                <div className={`p-4 rounded ${step >= 2 ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <div className="font-bold">Step 2: Get Profile</div>
                    {results.profile && (
                        <div className="text-sm mt-2">
                            Platform ID: {results.profile}
                        </div>
                    )}
                </div>

                <div className={`p-4 rounded ${step >= 3 ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <div className="font-bold">Step 3: Get Role Assignments</div>
                    {results.assignments !== undefined && (
                        <div className="text-sm mt-2">
                            Assignments: {results.assignments}
                        </div>
                    )}
                </div>

                <div className={`p-4 rounded ${step >= 4 ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <div className="font-bold">Step 4: Get Roles</div>
                    {results.roles && (
                        <div className="text-sm mt-2">
                            Roles: {results.roles}
                        </div>
                    )}
                </div>

                <div className={`p-4 rounded ${step >= 5 ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <div className="font-bold">Step 5: Complete!</div>
                    {step >= 5 && !error && (
                        <div className="text-sm mt-2 text-green-600">
                            ✅ Privilege system working correctly
                        </div>
                    )}
                </div>

                {error && (
                    <div className="p-4 rounded bg-red-100 text-red-700">
                        <div className="font-bold">Error at Step {step}:</div>
                        <div className="text-sm mt-2">{error}</div>
                    </div>
                )}
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded">
                <div className="font-bold mb-2">Debug Info:</div>
                <pre className="text-xs">{JSON.stringify(results, null, 2)}</pre>
            </div>
        </div>
    )
}
