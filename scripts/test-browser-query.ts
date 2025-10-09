import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create client with anon key (like the browser does)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testBrowserQuery() {
    console.log('=== Testing Browser Query ===\n')

    // First, sign in as tony
    console.log('1. Signing in as tony@fusionduotech.com...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'tony@fusionduotech.com',
        password: 'Manu@3002'
    })

    if (authError) {
        console.error('❌ Auth error:', authError)
        return
    }

    console.log('✅ Signed in successfully')
    console.log('   User ID:', authData.user.id)

    // Get profile to check platform_id
    console.log('\n2. Fetching profile...')
    const { data: profile, error: profileError } = await supabase
        .schema('master_data')
        .from('profiles')
        .select('user_platform_id')
        .eq('user_id', authData.user.id)
        .single()

    if (profileError) {
        console.error('❌ Profile error:', profileError)
        return
    }

    console.log('✅ Profile found')
    console.log('   Platform ID:', profile.user_platform_id)

    // Try to fetch organizations
    console.log('\n3. Fetching organizations...')
    const { data: orgs, error: orgsError } = await supabase
        .schema('master_data')
        .from('organizations')
        .select('*')
        .eq('owner_platform_id', profile.user_platform_id)
        .eq('is_active', 'active')
        .order('created_at', { ascending: false })

    if (orgsError) {
        console.error('❌ Organizations error:', orgsError)
        console.error('   Error details:', JSON.stringify(orgsError, null, 2))
        return
    }

    console.log('✅ Organizations query successful')
    console.log('   Found:', orgs?.length || 0, 'organization(s)')
    
    if (orgs && orgs.length > 0) {
        console.log('\nOrganizations:')
        orgs.forEach(org => {
            console.log(`   - ${org.organization_name}`)
            console.log(`     ID: ${org.id}`)
            console.log(`     Active: ${org.is_active}`)
        })
    }

    // Sign out
    await supabase.auth.signOut()
}

testBrowserQuery().catch(console.error)
