import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function findMyPrivileges() {
    console.log('🔍 Finding your privilege assignments...\n')

    // Query user_to_role_assignment to see all active assignments
    const { data: assignments, error: assignmentsError } = await supabase
        .schema('master_data')
        .from('user_to_role_assignment')
        .select(`
            *,
            platform_roles (
                id,
                role_name,
                privilege_level,
                permissions,
                modules
            )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    if (assignmentsError) {
        console.error('❌ Error:', assignmentsError.message)
        console.error('   Details:', assignmentsError)
        return
    }

    if (!assignments || assignments.length === 0) {
        console.log('⚠️  No active role assignments found in the database')
        console.log('   Check if you have created entries in master_data.user_to_role_assignment')
        return
    }

    console.log(`Found ${assignments.length} active role assignment(s):\n`)
    console.log('='.repeat(80))

    // Group by user_id
    const byUser = new Map<string, typeof assignments>()
    assignments.forEach((assignment) => {
        const userId = assignment.user_id
        if (!byUser.has(userId)) {
            byUser.set(userId, [])
        }
        byUser.get(userId)!.push(assignment)
    })

    byUser.forEach((userAssignments, userId) => {
        console.log(`\n👤 User ID: ${userId}`)
        console.log(`   Assignments: ${userAssignments.length}\n`)

        userAssignments.forEach((assignment, index) => {
            const role = assignment.platform_roles

            if (!role) {
                console.log(`   ${index + 1}. [Role ID: ${assignment.platform_role_id}]`)
                console.log(`      ⚠️  Role not found in platform_roles table\n`)
                return
            }

            console.log(`   ${index + 1}. ${role.role_name}`)
            console.log(`      Privilege Level: ${role.privilege_level}`)
            console.log(`      Assigned: ${new Date(assignment.created_at).toLocaleDateString()}`)
            
            if (assignment.expires_at) {
                const expiryDate = new Date(assignment.expires_at)
                const isExpired = expiryDate < new Date()
                console.log(`      Expires: ${expiryDate.toLocaleDateString()} ${isExpired ? '⚠️  EXPIRED' : ''}`)
            }

            if (role.permissions && Object.keys(role.permissions).length > 0) {
                const permissionsList = Object.keys(role.permissions)
                console.log(`      Permissions: ${permissionsList.length} total`)
            }

            if (role.modules && Array.isArray(role.modules) && role.modules.length > 0) {
                console.log(`      Modules: ${role.modules.length} total`)
            }

            console.log()
        })

        // Find highest privilege for this user
        const roles = userAssignments.map(a => a.platform_roles).filter(Boolean)
        const privilegeLevels = roles.map(r => r.privilege_level).filter(Boolean)
        
        if (privilegeLevels.length > 0) {
            const highest = Math.min(...privilegeLevels)
            const highestRole = roles.find(r => r.privilege_level === highest)
            
            console.log('   🏆 HIGHEST PRIVILEGE:')
            console.log(`      ${highestRole?.role_name} (Level ${highest})`)
            
            // Show what this level means
            const levelNames: Record<number, string> = {
                1: 'Platform Admin - Full platform control',
                2: 'Organization Admin - Manages organizations',
                3: 'Entity Admin - Entity-level administration',
                4: 'Provider Admin - Provider management',
                5: 'Clinical Lead - Clinical oversight',
                6: 'Provider - Healthcare providers',
                7: 'Frontdesk Lead - Front desk supervision',
                8: 'Inventory Lead - Inventory management lead',
                9: 'Frontdesk - Reception staff',
                10: 'Inventory - Inventory staff',
                11: 'Scheduler - Appointment scheduling',
                12: 'Billing - Billing operations',
                13: 'User - Standard user'
            }
            
            if (levelNames[highest]) {
                console.log(`      ${levelNames[highest]}`)
            }
        }

        console.log('\n' + '='.repeat(80))
    })

    console.log('\n✨ To see this in the UI, sign in and visit: http://localhost:3001/organization')
}

findMyPrivileges().catch(console.error)
