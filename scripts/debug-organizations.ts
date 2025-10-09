import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function debugOrganizations() {
    console.log('=== Debugging Organizations ===\n')

    // 1. Check tony's profile and platform_id
    console.log('1. Checking tony@fusionduotech.com profile...')
    const { data: profiles, error: profileError } = await supabase
        .schema('master_data')
        .from('profiles')
        .select('user_id, user_platform_id, first_name, last_name, email')
        .eq('email', 'tony@fusionduotech.com')

    if (profileError) {
        console.error('Error fetching profile:', profileError)
        return
    }

    console.log('Profile:', profiles)
    const profile = profiles?.[0]
    
    if (!profile) {
        console.log('❌ No profile found for tony@fusionduotech.com')
        return
    }

    console.log(`✅ Found profile: ${profile.first_name} ${profile.last_name}`)
    console.log(`   User ID: ${profile.user_id}`)
    console.log(`   Platform ID: ${profile.user_platform_id}\n`)

    // 2. Check all organizations
    console.log('2. Checking all organizations in database...')
    const { data: allOrgs, error: allOrgsError } = await supabase
        .schema('master_data')
        .from('organizations')
        .select('*')

    if (allOrgsError) {
        console.error('Error fetching organizations:', allOrgsError)
        return
    }

    console.log(`Found ${allOrgs?.length || 0} organizations:`)
    allOrgs?.forEach((org: any) => {
        console.log(`\n   - ${org.name}`)
        console.log(`     ID: ${org.id}`)
        console.log(`     Owner Platform ID: ${org.owner_platform_id}`)
        console.log(`     Active: ${org.is_active}`)
        console.log(`     Created: ${org.created_at}`)
    })

    // 3. Check organizations matching tony's platform_id
    console.log('\n3. Checking organizations owned by tony...')
    const { data: tonyOrgs, error: tonyOrgsError } = await supabase
        .schema('master_data')
        .from('organizations')
        .select('*')
        .eq('owner_platform_id', profile.user_platform_id)

    if (tonyOrgsError) {
        console.error('Error fetching tony\'s organizations:', tonyOrgsError)
        return
    }

    if (tonyOrgs && tonyOrgs.length > 0) {
        console.log(`✅ Found ${tonyOrgs.length} organization(s) for tony:`)
        tonyOrgs.forEach((org: any) => {
            console.log(`   - ${org.name} (${org.is_active ? 'Active' : 'Inactive'})`)
        })
    } else {
        console.log('❌ No organizations found for tony\'s platform ID:', profile.user_platform_id)
    }

    // 4. Check RLS policies on organizations table
    console.log('\n4. Checking RLS status...')
    const { data: rlsStatus, error: rlsError } = await supabase
        .rpc('exec', {
            query: `
                SELECT 
                    schemaname,
                    tablename,
                    rowsecurity
                FROM pg_tables 
                WHERE schemaname = 'master_data' 
                AND tablename = 'organizations'
            `
        })

    console.log('RLS Status:', rlsStatus)
}

debugOrganizations().catch(console.error)
