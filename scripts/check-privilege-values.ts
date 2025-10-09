import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkPrivilegeLevels() {
    console.log('🔍 Checking privilege level values in database...\n')
    
    // Get Tony's roles
    const { data: profile } = await supabase
        .schema('master_data')
        .from('profiles')
        .select('user_platform_id')
        .eq('email', 'tony@fusionduotech.com')
        .single()
    
    if (!profile) {
        console.error('Could not find Tony\'s profile')
        return
    }

    const { data: assignments } = await supabase
        .schema('master_data')
        .from('user_to_role_assignment')
        .select(`
            *,
            platform_roles:platform_role_id (*)
        `)
        .eq('user_platform_id', profile.user_platform_id)
        .eq('is_active', true)
    
    if (!assignments || assignments.length === 0) {
        console.log('No assignments found')
        return
    }

    console.log('Tony\'s role assignments:\n')
    assignments.forEach((a: any, i) => {
        const role = a.platform_roles
        console.log(`${i + 1}. ${role.role_name}`)
        console.log('   privilege_level:', JSON.stringify(role.privilege_level))
        console.log('   Type:', typeof role.privilege_level)
        console.log('   permissions:', JSON.stringify(role.permissions))
        console.log('   modules:', JSON.stringify(role.modules))
        console.log()
    })
}

checkPrivilegeLevels()
    .then(() => {
        console.log('✅ Check complete')
        process.exit(0)
    })
    .catch(err => {
        console.error('❌ Error:', err)
        process.exit(1)
    })
