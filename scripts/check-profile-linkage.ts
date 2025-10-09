import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const tonyEmail = 'tony@fusionduotech.com'
const tonyUserId = '89af6091-a4a9-41bc-ab83-a9184da9bbe4'

async function checkProfileLinkage() {
    console.log('🔍 Checking profile linkage for tony@fusionduotech.com\n')

    // Check if profiles table exists and what tony's profile looks like
    console.log('1️⃣ Checking profiles table...')
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', tonyUserId)
        .single()

    if (profileError) {
        console.log('   ❌ Error:', profileError.message)
        console.log('   Code:', profileError.code)
        return
    }

    if (!profile) {
        console.log('   ⚠️  No profile found for this user')
        return
    }

    console.log('   ✅ Profile found!')
    console.log('   User ID:', profile.user_id)
    console.log('   User Platform ID:', profile.user_platform_id || 'NULL')
    console.log('   Full profile:', JSON.stringify(profile, null, 2))

    if (!profile.user_platform_id) {
        console.log('\n   ⚠️  user_platform_id is NULL - no platform admin linkage')
        return
    }

    // Check platform_admin table
    console.log('\n2️⃣ Checking platform_admin table...')
    const { data: platformAdmin, error: adminError } = await supabase
        .from('platform_admin')
        .select('*')
        .eq('id', profile.user_platform_id)
        .single()

    if (adminError) {
        console.log('   ❌ Error:', adminError.message)
        return
    }

    console.log('   ✅ Platform admin record found!')
    console.log('   ID:', platformAdmin.id)
    console.log('   Full record:', JSON.stringify(platformAdmin, null, 2))

    // Check user_to_role_assignment for this platform admin
    console.log('\n3️⃣ Checking user_to_role_assignment...')
    const { data: assignments, error: assignError } = await supabase
        .schema('master_data')
        .from('user_to_role_assignment')
        .select(`
            *,
            platform_roles (*)
        `)
        .eq('user_id', platformAdmin.id)
        .eq('is_active', true)

    if (assignError) {
        console.log('   ❌ Error:', assignError.message)
        return
    }

    if (!assignments || assignments.length === 0) {
        console.log('   ⚠️  No role assignments for this platform_admin ID')
        console.log(`\n   To assign a role, run:`)
        console.log(`   INSERT INTO master_data.user_to_role_assignment (user_id, platform_role_id, is_active)`)
        console.log(`   VALUES ('${platformAdmin.id}',`)
        console.log(`           (SELECT id FROM master_data.platform_roles WHERE role_name = 'platform_admin' LIMIT 1),`)
        console.log(`           true);`)
        return
    }

    console.log(`   ✅ Found ${assignments.length} role assignment(s)!`)
    assignments.forEach((assign: any) => {
        const role = assign.platform_roles
        console.log(`\n   • ${role.role_name}`)
        console.log(`     Privilege Level: ${role.privilege_level}`)
        console.log(`     Is Active: ${assign.is_active}`)
    })

    console.log('\n' + '='.repeat(70))
    console.log('✅ LINKAGE CHAIN:')
    console.log(`   auth.users (${tonyUserId})`)
    console.log(`   → profiles.user_id`)
    console.log(`   → profiles.user_platform_id (${profile.user_platform_id})`)
    console.log(`   → platform_admin.id`)
    console.log(`   → user_to_role_assignment.user_id`)
    console.log(`   → platform_roles`)
}

checkProfileLinkage().catch(console.error)
