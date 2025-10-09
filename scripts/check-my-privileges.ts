import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkMyPrivileges() {
    console.log('🔍 Checking current user privileges...\n')

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        console.error('❌ Error getting user:', userError?.message || 'No user logged in')
        console.log('\n💡 Please sign in at http://localhost:3001/auth/sign-in')
        return
    }

    console.log('✅ Logged in as:', user.email)
    console.log('   User ID:', user.id)
    console.log()

    // Fetch role assignments
    const { data: assignments, error: assignmentsError } = await supabase
        .schema('master_data')
        .from('user_to_role_assignment')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

    if (assignmentsError) {
        console.error('❌ Error fetching role assignments:', assignmentsError.message)
        return
    }

    if (!assignments || assignments.length === 0) {
        console.log('⚠️  No active role assignments found')
        console.log('   You need to be assigned a role in master_data.user_to_role_assignment')
        return
    }

    console.log(`📋 Found ${assignments.length} active role assignment(s):\n`)

    // Fetch the corresponding platform roles
    const roleIds = assignments.map((a) => a.platform_role_id).filter(Boolean)
    
    const { data: roles, error: rolesError } = await supabase
        .schema('master_data')
        .from('platform_roles')
        .select('*')
        .in('id', roleIds)

    if (rolesError) {
        console.error('❌ Error fetching platform roles:', rolesError.message)
        return
    }

    if (!roles || roles.length === 0) {
        console.log('⚠️  No platform roles found for your assignments')
        return
    }

    // Display each role
    roles.forEach((role, index) => {
        const assignment = assignments.find((a) => a.platform_role_id === role.id)
        
        console.log(`${index + 1}. ${role.role_name}`)
        console.log(`   Privilege Level: ${role.privilege_level}`)
        console.log(`   Role ID: ${role.id}`)
        
        if (assignment) {
            console.log(`   Assigned: ${new Date(assignment.created_at).toLocaleDateString()}`)
            if (assignment.expires_at) {
                console.log(`   Expires: ${new Date(assignment.expires_at).toLocaleDateString()}`)
            }
        }

        if (role.permissions && Object.keys(role.permissions).length > 0) {
            const permissionsList = Object.keys(role.permissions)
            console.log(`   Permissions (${permissionsList.length}):`)
            permissionsList.slice(0, 5).forEach((p) => console.log(`     • ${p}`))
            if (permissionsList.length > 5) {
                console.log(`     ... and ${permissionsList.length - 5} more`)
            }
        }

        if (role.modules && role.modules.length > 0) {
            console.log(`   Modules (${role.modules.length}):`)
            role.modules.slice(0, 5).forEach((m) => console.log(`     • ${m}`))
            if (role.modules.length > 5) {
                console.log(`     ... and ${role.modules.length - 5} more`)
            }
        }

        console.log()
    })

    // Find highest privilege level
    const privilegeLevels = roles.map((r) => r.privilege_level).filter(Boolean)
    if (privilegeLevels.length > 0) {
        const highest = Math.min(...privilegeLevels)
        const highestRole = roles.find((r) => r.privilege_level === highest)
        
        console.log('🏆 Your Highest Privilege Level:')
        console.log(`   ${highestRole?.role_name} (Level ${highest})`)
        console.log()
    }

    // Aggregate all permissions
    const allPermissions = new Set<string>()
    roles.forEach((role) => {
        if (role.permissions) {
            Object.keys(role.permissions).forEach((p) => allPermissions.add(p))
        }
    })

    // Aggregate all modules
    const allModules = new Set<string>()
    roles.forEach((role) => {
        if (role.modules && Array.isArray(role.modules)) {
            role.modules.forEach((m) => allModules.add(m))
        }
    })

    console.log(`📊 Total Permissions: ${allPermissions.size}`)
    console.log(`📦 Total Modules: ${allModules.size}`)
    console.log()
    console.log('✨ Visit http://localhost:3001/organization to see your role dashboard')
}

checkMyPrivileges().catch(console.error)
