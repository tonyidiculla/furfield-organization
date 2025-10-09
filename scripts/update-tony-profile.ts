import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const targetEmail = 'tony@fusionduotech.com'
const targetUserId = '89af6091-a4a9-41bc-ab83-a9184da9bbe4'

async function updateTonyProfile() {
    console.log('🔍 Finding Tony\'s profile by email...\n')
    
    // Find Tony's profile by email
    const { data: profile, error: findError } = await supabase
        .schema('master_data')
        .from('profiles')
        .select('*')
        .eq('email', targetEmail)
        .single()
    
    if (findError || !profile) {
        console.error('❌ Could not find profile with email:', targetEmail)
        console.error('Error:', findError?.message)
        return
    }

    console.log('✅ Found profile:')
    console.log('   ID:', profile.id)
    console.log('   Email:', profile.email)
    console.log('   user_platform_id:', profile.user_platform_id)
    console.log('   Current user_id:', profile.user_id || 'NULL')
    console.log()

    if (profile.user_id === targetUserId) {
        console.log('✅ Profile already linked to auth user!')
        return
    }

    console.log('📝 Updating profile with auth user_id...\n')
    
    // Update the profile with auth user_id
    const { data: updated, error: updateError } = await supabase
        .schema('master_data')
        .from('profiles')
        .update({ user_id: targetUserId })
        .eq('id', profile.id)
        .select()
    
    if (updateError) {
        console.error('❌ Error updating profile:', updateError.message)
        return
    }

    console.log('✅ Successfully updated profile!')
    console.log('   user_id:', targetUserId)
    console.log('   user_platform_id:', profile.user_platform_id)
    console.log()
    
    // Now verify the privilege chain works
    console.log('🔗 Testing privilege chain...\n')
    
    // Step 1: Get user_platform_id from profiles
    const { data: verifyProfile, error: verifyError } = await supabase
        .schema('master_data')
        .from('profiles')
        .select('user_platform_id')
        .eq('user_id', targetUserId)
        .single()
    
    if (verifyError || !verifyProfile) {
        console.error('❌ Could not verify profile lookup')
        return
    }
    
    console.log('✅ Step 1: Found user_platform_id:', verifyProfile.user_platform_id)
    
    // Step 2: Get role assignments
    const { data: assignments, error: assignError } = await supabase
        .schema('master_data')
        .from('user_to_role_assignment')
        .select(`
            *,
            platform_roles:platform_role_id (*)
        `)
        .eq('user_platform_id', verifyProfile.user_platform_id)
        .eq('is_active', true)
    
    if (assignError) {
        console.error('❌ Error fetching assignments:', assignError.message)
        return
    }
    
    console.log('✅ Step 2: Found', assignments?.length || 0, 'active role assignment(s)')
    
    if (assignments && assignments.length > 0) {
        console.log()
        assignments.forEach((a: any, i) => {
            const role = a.platform_roles
            console.log(`${i + 1}. Role: ${role.role_name}`)
            console.log(`   Privilege Level: ${role.privilege_level}`)
            console.log(`   Permissions: ${Object.keys(role.permissions || {}).length}`)
            console.log(`   Modules: ${Object.keys(role.modules || {}).length}`)
        })
        
        const highestPrivilege = Math.min(...assignments.map((a: any) => a.platform_roles.privilege_level))
        console.log()
        console.log('🏆 Highest Privilege Level:', highestPrivilege)
    } else {
        console.log('   ⚠️  No role assignments found')
        console.log('   You may need to create a role assignment for this user_platform_id')
    }
}

updateTonyProfile()
    .then(() => {
        console.log('\n✅ Operation complete')
        process.exit(0)
    })
    .catch(err => {
        console.error('❌ Error:', err)
        process.exit(1)
    })
