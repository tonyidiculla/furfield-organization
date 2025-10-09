import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const targetUserId = '89af6091-a4a9-41bc-ab83-a9184da9bbe4'

async function testPrivilegeFetchingDirect() {
    console.log('🧪 Testing privilege fetching (direct implementation)...\n')
    console.log('User ID:', targetUserId)
    console.log()
    
    // Step 1: Get user_platform_id from profiles
    console.log('Step 1: Fetching profile...')
    const { data: profile, error: profileError } = await supabase
        .schema('master_data')
        .from('profiles')
        .select('user_platform_id')
        .eq('user_id', targetUserId)
        .single()

    if (profileError || !profile?.user_platform_id) {
        console.error('❌ Error fetching profile:', profileError)
        return
    }

    console.log('✅ user_platform_id:', profile.user_platform_id)
    console.log()

    // Step 2: Get role assignments
    console.log('Step 2: Fetching role assignments...')
    const { data: assignments, error: assignmentsError } = await supabase
        .schema('master_data')
        .from('user_to_role_assignment')
        .select('*')
        .eq('user_platform_id', profile.user_platform_id)
        .eq('is_active', true)

    if (assignmentsError) {
        console.error('❌ Error fetching assignments:', assignmentsError)
        return
    }

    console.log('✅ Found', assignments?.length || 0, 'assignments')
    console.log()

    if (!assignments || assignments.length === 0) {
        console.log('⚠️  No active role assignments')
        return
    }

    // Step 3: Get platform roles
    console.log('Step 3: Fetching platform roles...')
    const roleIds = assignments.map(a => a.platform_role_id)
    
    const { data: roles, error: rolesError } = await supabase
        .schema('master_data')
        .from('platform_roles')
        .select('*')
        .in('id', roleIds)
        .eq('is_active', true)

    if (rolesError) {
        console.error('❌ Error fetching roles:', rolesError)
        return
    }

    console.log('✅ Found', roles?.length || 0, 'roles')
    console.log()

    // Step 4: Aggregate privileges
    console.log('Step 4: Aggregating privileges...\n')
    
    const allPermissions = new Set<string>()
    const allModules = new Set<string>()
    
    roles?.forEach(role => {
        console.log(`📋 ${role.role_name}`)
        console.log(`   Privilege Level: ${role.privilege_level}`)
        console.log(`   Permissions: ${Array.isArray(role.permissions) ? role.permissions.length : 'N/A'}`)
        console.log(`   Modules: ${Array.isArray(role.modules) ? role.modules.length : 'N/A'}`)
        
        if (Array.isArray(role.permissions)) {
            role.permissions.forEach(p => allPermissions.add(p))
        }
        if (Array.isArray(role.modules)) {
            role.modules.forEach(m => allModules.add(m))
        }
        console.log()
    })

    console.log('🎯 Summary:')
    console.log(`   Total Unique Permissions: ${allPermissions.size}`)
    console.log(`   Total Unique Modules: ${allModules.size}`)
    
    if (allPermissions.size > 0) {
        const perms = Array.from(allPermissions)
        console.log(`\n🔑 Permissions (showing first 10):`)
        console.log('   ', perms.slice(0, 10).join(', '))
    }
    
    if (allModules.size > 0) {
        const mods = Array.from(allModules)
        console.log(`\n🧩 Modules:`)
        console.log('   ', mods.join(', '))
    }
}

testPrivilegeFetchingDirect()
    .then(() => {
        console.log('\n✅ Test complete')
        process.exit(0)
    })
    .catch(err => {
        console.error('❌ Error:', err)
        console.error(err.stack)
        process.exit(1)
    })
