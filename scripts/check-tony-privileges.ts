import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const targetEmail = 'tony@fusionduotech.com'
const targetUserId = '89af6091-a4a9-41bc-ab83-a9184da9bbe4'

async function checkTonyPrivileges() {
    console.log('🔍 Checking privileges for tony@fusionduotech.com\n')
    console.log('User ID:', targetUserId)
    console.log('Email Confirmed: ✅ Yes')
    console.log('Last Sign In: 10/3/2025, 5:03:35 PM')
    console.log()

    // Check role assignments
    console.log('📋 Checking role assignments...')
    const { data: assignments, error: assignError } = await supabase
        .schema('master_data')
        .from('user_to_role_assignment')
        .select(`
            *,
            platform_roles (*)
        `)
        .eq('user_id', targetUserId)

    if (assignError) {
        console.log('   ❌ Error:', assignError.message)
        return
    }

    if (!assignments || assignments.length === 0) {
        console.log('   ⚠️  NO ROLE ASSIGNMENTS FOUND\n')
        console.log('tony@fusionduotech.com has NO privileges assigned!')
        console.log('\n📝 To assign platform_admin role, run this SQL:')
        console.log(`
INSERT INTO master_data.user_to_role_assignment (user_id, platform_role_id, is_active)
VALUES (
  '${targetUserId}',
  (SELECT id FROM master_data.platform_roles WHERE role_name = 'platform_admin' LIMIT 1),
  true
);`)
        console.log('\n💡 Note: You need roles in platform_roles table first!')
        
        // Check if any roles exist
        const { data: roles, error: rolesError } = await supabase
            .schema('master_data')
            .from('platform_roles')
            .select('id, role_name, privilege_level')
            .limit(5)
        
        if (!rolesError && roles && roles.length > 0) {
            console.log('\nAvailable roles to assign:')
            roles.forEach(r => {
                console.log(`  - ${r.role_name} (Level ${r.privilege_level})`)
            })
        } else {
            console.log('\n⚠️  No roles found in platform_roles table!')
            console.log('You need to import roles from master_data_dump.sql.bkp first.')
        }
        return
    }

    console.log(`   ✅ Found ${assignments.length} role assignment(s)\n`)

    assignments.forEach((assign: any, i) => {
        const role = assign.platform_roles
        console.log(`${i + 1}. ${role.role_name}`)
        console.log(`   Privilege Level: ${role.privilege_level}`)
        console.log(`   Is Active: ${assign.is_active}`)
        if (role.permissions) {
            console.log(`   Permissions: ${Object.keys(role.permissions).length}`)
        }
        if (role.modules) {
            console.log(`   Modules: ${role.modules.length}`)
        }
        console.log()
    })

    const activeAssignments = assignments.filter((a: any) => a.is_active)
    if (activeAssignments.length > 0) {
        const levels = activeAssignments.map((a: any) => a.platform_roles?.privilege_level).filter((l: any) => l != null)
        if (levels.length > 0) {
            const highest = Math.min(...levels)
            const highestRole = activeAssignments.find((a: any) => a.platform_roles?.privilege_level === highest)
            
            console.log('🏆 HIGHEST PRIVILEGE:')
            console.log(`   ${highestRole.platform_roles.role_name} (Level ${highest})`)
        }
    }

    console.log('\n✅ Sign in with tony@fusionduotech.com and visit:')
    console.log('   http://localhost:3001/organization')
}

checkTonyPrivileges().catch(console.error)
