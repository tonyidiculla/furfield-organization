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
    console.log('Auth User ID:', targetUserId)
    console.log()

    // Step 1: Get user_platform_id from profiles
    console.log('📋 Step 1: Fetching profile...')
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_platform_id')
        .eq('user_id', targetUserId)
        .single()

    if (profileError) {
        console.log('   ❌ Error:', profileError.message)
        return
    }

    if (!profile?.user_platform_id) {
        console.log('   ⚠️  NO user_platform_id found in profile')
        return
    }

    console.log('   ✅ user_platform_id:', profile.user_platform_id)
    console.log()

    // Step 2: Check role assignments using user_platform_id
    console.log('📋 Step 2: Checking role assignments...')
    const { data: assignments, error: assignError } = await supabase
        .schema('master_data')
        .from('user_to_role_assignment')
        .select(`
            *,
            platform_roles:platform_role_id (*)
        `)
        .eq('user_platform_id', profile.user_platform_id)

    if (assignError) {
        console.log('   ❌ Error:', assignError.message)
        return
    }

    if (!assignments || assignments.length === 0) {
        console.log('   ⚠️  NO ROLE ASSIGNMENTS FOUND\n')
        console.log('tony@fusionduotech.com has NO privileges assigned!')
        console.log('\n📝 To assign platform_admin role, run this SQL:')
        console.log(`
INSERT INTO master_data.user_to_role_assignment (user_platform_id, platform_role_id, is_active)
VALUES (
  '${profile.user_platform_id}',
  (SELECT id FROM master_data.platform_roles WHERE role_name = 'platform_admin' LIMIT 1),
  true
);`)
        return
    }

    console.log(`   ✅ Found ${assignments.length} role assignment(s)\n`)

    // Step 3: Display privileges
    console.log('🎯 Tony\'s Privileges:\n')
    
    assignments.forEach((assign: any, i) => {
        const role = assign.platform_roles
        console.log(`${i + 1}. ${role.role_name}`)
        console.log(`   Privilege Level: ${role.privilege_level}`)
        console.log(`   Is Active: ${assign.is_active ? '✅' : '❌'}`)
        if (role.permissions) {
            const perms = Object.keys(role.permissions)
            console.log(`   Permissions (${perms.length}):`, perms.slice(0, 5).join(', '))
        }
        if (role.modules) {
            const mods = Object.keys(role.modules)
            console.log(`   Modules (${mods.length}):`, mods.slice(0, 5).join(', '))
        }
        console.log()
    })

    // Determine highest privilege
    const activeAssignments = assignments.filter((a: any) => a.is_active)
    if (activeAssignments.length > 0) {
        const highestPrivilege = Math.min(...activeAssignments.map((a: any) => a.platform_roles.privilege_level))
        console.log(`🏆 Highest Privilege Level: ${highestPrivilege}`)
        
        // Aggregate all permissions
        const allPermissions = new Set<string>()
        const allModules = new Set<string>()
        
        activeAssignments.forEach((a: any) => {
            const role = a.platform_roles
            if (role.permissions) {
                Object.keys(role.permissions).forEach(p => allPermissions.add(p))
            }
            if (role.modules) {
                Object.keys(role.modules).forEach(m => allModules.add(m))
            }
        })
        
        console.log(`📦 Total Unique Permissions: ${allPermissions.size}`)
        console.log(`🧩 Total Unique Modules: ${allModules.size}`)
    }
}

checkTonyPrivileges()
    .then(() => {
        console.log('\n✅ Check complete')
        process.exit(0)
    })
    .catch(err => {
        console.error('❌ Error:', err)
        process.exit(1)
    })
