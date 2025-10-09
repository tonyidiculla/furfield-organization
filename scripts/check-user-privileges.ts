import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUserPrivileges() {
    console.log('🔍 Searching for users with role assignments...\n')

    // First, get all users from auth.users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
        console.error('❌ Error fetching users:', usersError.message)
        return
    }

    if (!users || users.length === 0) {
        console.log('⚠️  No users found')
        return
    }

    console.log(`Found ${users.length} user(s) in the system:\n`)

    for (const user of users) {
        console.log('─'.repeat(80))
        console.log(`👤 User: ${user.email}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`)
        console.log()

        // Fetch role assignments for this user
        const { data: assignments, error: assignmentsError } = await supabase
            .schema('master_data')
            .from('user_to_role_assignment')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)

        if (assignmentsError) {
            console.error('   ❌ Error fetching role assignments:', assignmentsError.message)
            continue
        }

        if (!assignments || assignments.length === 0) {
            console.log('   ⚠️  No active role assignments\n')
            continue
        }

        console.log(`   📋 ${assignments.length} active role assignment(s):\n`)

        // Fetch the corresponding platform roles
        const roleIds = assignments.map((a) => a.platform_role_id).filter(Boolean)
        
        const { data: roles, error: rolesError } = await supabase
            .schema('master_data')
            .from('platform_roles')
            .select('*')
            .in('id', roleIds)

        if (rolesError) {
            console.error('   ❌ Error fetching platform roles:', rolesError.message)
            continue
        }

        if (!roles || roles.length === 0) {
            console.log('   ⚠️  No platform roles found\n')
            continue
        }

        // Display each role
        roles.forEach((role, index) => {
            const assignment = assignments.find((a) => a.platform_role_id === role.id)
            
            console.log(`   ${index + 1}. ${role.role_name}`)
            console.log(`      Privilege Level: ${role.privilege_level}`)
            console.log(`      Role ID: ${role.id}`)
            
            if (assignment) {
                console.log(`      Assigned: ${new Date(assignment.created_at).toLocaleDateString()}`)
                if (assignment.expires_at) {
                    console.log(`      Expires: ${new Date(assignment.expires_at).toLocaleDateString()}`)
                }
            }

            if (role.permissions && Object.keys(role.permissions).length > 0) {
                const permissionsList = Object.keys(role.permissions)
                console.log(`      Permissions: ${permissionsList.length}`)
                permissionsList.slice(0, 3).forEach((p) => console.log(`        • ${p}`))
                if (permissionsList.length > 3) {
                    console.log(`        ... and ${permissionsList.length - 3} more`)
                }
            }

            if (role.modules && role.modules.length > 0) {
                console.log(`      Modules: ${role.modules.length}`)
                role.modules.slice(0, 3).forEach((m) => console.log(`        • ${m}`))
                if (role.modules.length > 3) {
                    console.log(`        ... and ${role.modules.length - 3} more`)
                }
            }

            console.log()
        })

        // Find highest privilege level
        const privilegeLevels = roles.map((r) => r.privilege_level).filter(Boolean)
        if (privilegeLevels.length > 0) {
            const highest = Math.min(...privilegeLevels)
            const highestRole = roles.find((r) => r.privilege_level === highest)
            
            console.log('   🏆 HIGHEST PRIVILEGE LEVEL:')
            console.log(`      ${highestRole?.role_name} (Level ${highest})`)
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

        console.log(`   📊 Total Permissions: ${allPermissions.size}`)
        console.log(`   📦 Total Modules: ${allModules.size}`)
        console.log()
    }

    console.log('─'.repeat(80))
    console.log('✨ Done! Visit http://localhost:3001/organization to see your dashboard')
}

checkUserPrivileges().catch(console.error)
