import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
    console.log('🔍 Checking master_data schema...\n')

    // Check profiles
    const { data: profiles, error: profilesError } = await supabase
        .schema('master_data')
        .from('profiles')
        .select('*')
        .limit(1)

    console.log('master_data.profiles:', profilesError ? `❌ ${profilesError.message}` : `✅ Exists (${profiles?.length || 0} rows shown)`)

    if (!profilesError && profiles && profiles.length > 0) {
        console.log('\n📄 master_data.profiles columns:', Object.keys(profiles[0]))
    }

    // Check platform roles
    const { data: platformRoles, error: rolesError } = await supabase
        .schema('master_data')
        .from('platform_roles')
        .select('*')
        .limit(1)

    console.log('\nmaster_data.platform_roles:', rolesError ? `❌ ${rolesError.message}` : `✅ Exists (${platformRoles?.length || 0} rows shown)`)

    if (!rolesError && platformRoles && platformRoles.length > 0) {
        console.log('\n📄 master_data.platform_roles columns:', Object.keys(platformRoles[0]))
    }

    // Check hospital assignments (if present)
    const { data: hospitalAssignments, error: hospitalAssignmentsError } = await supabase
        .schema('master_data')
        .from('user_to_role_assignment')
        .select('*')
        .limit(1)

    console.log('\nmaster_data.user_to_role_assignment:', hospitalAssignmentsError ? `❌ ${hospitalAssignmentsError.message}` : `✅ Exists (${hospitalAssignments?.length || 0} rows shown)`)
    
    if (!hospitalAssignmentsError && hospitalAssignments && hospitalAssignments.length > 0) {
        console.log('\n📄 master_data.user_to_role_assignment columns:', Object.keys(hospitalAssignments[0]))
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
