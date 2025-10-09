import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
    console.log('🔍 Checking database schema...\n')

    // Check public schema tables
    console.log('📋 Checking public schema...')
    
    // Try profiles
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
    
    console.log('profiles table:', profilesError ? `❌ ${profilesError.message}` : `✅ Exists (${profiles?.length || 0} rows shown)`)
    
    // Try platform_admin
    const { data: platformAdmin, error: platformAdminError } = await supabase
        .from('platform_admin')
        .select('*')
        .limit(1)
    
    console.log('platform_admin table:', platformAdminError ? `❌ ${platformAdminError.message}` : `✅ Exists (${platformAdmin?.length || 0} rows shown)`)
    
    // Show what columns exist if tables are found
    if (!profilesError && profiles && profiles.length > 0) {
        console.log('\n📄 profiles columns:', Object.keys(profiles[0]))
    }
    
    if (!platformAdminError && platformAdmin && platformAdmin.length > 0) {
        console.log('\n📄 platform_admin columns:', Object.keys(platformAdmin[0]))
    }

    // Check master_data schema
    console.log('\n📋 Checking master_data schema...')
    
    const { data: assignments, error: assignmentsError } = await supabase
        .schema('master_data')
        .from('user_to_role_assignment')
        .select('*')
        .limit(1)
    
    console.log('user_to_role_assignment:', assignmentsError ? `❌ ${assignmentsError.message}` : `✅ Exists`)
    
    if (!assignmentsError && assignments && assignments.length > 0) {
        console.log('📄 user_to_role_assignment columns:', Object.keys(assignments[0]))
    }
}

checkSchema()
    .then(() => {
        console.log('\n✅ Check complete')
        process.exit(0)
    })
    .catch(err => {
        console.error('❌ Error:', err)
        process.exit(1)
    })
