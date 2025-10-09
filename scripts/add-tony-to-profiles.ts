import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const targetEmail = 'tony@fusionduotech.com'
const targetUserId = '89af6091-a4a9-41bc-ab83-a9184da9bbe4'

async function checkAndAddToProfiles() {
    console.log('🔍 Checking master_data.profiles table...\n')
    
    // First, check if profiles table exists in master_data schema
    console.log('📋 Fetching profiles schema...')
    const { data: existingProfiles, error: fetchError } = await supabase
        .schema('master_data')
        .from('profiles')
        .select('*')
        .limit(5)
    
    if (fetchError) {
        console.error('❌ Error fetching profiles:', fetchError.message)
        return
    }

    console.log(`   ✅ Found ${existingProfiles?.length || 0} profile(s)\n`)
    
    if (existingProfiles && existingProfiles.length > 0) {
        console.log('Sample profile structure:')
        console.log(JSON.stringify(existingProfiles[0], null, 2))
        console.log('\nProfile columns:', Object.keys(existingProfiles[0]))
        console.log()
    }

    // Check if Tony already exists in profiles
    console.log('🔎 Checking if Tony exists in profiles...')
    const { data: tonyProfile, error: tonyError } = await supabase
        .schema('master_data')
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single()
    
    if (tonyProfile) {
        console.log('   ✅ Tony already exists in profiles!')
        console.log('   user_platform_id:', tonyProfile.user_platform_id)
        return
    }

    console.log('   ⚠️  Tony not found in profiles')
    console.log('\n📝 Adding Tony to master_data.profiles...\n')
    
    // Generate a platform ID (following the H00XXXXX pattern)
    const platformId = `H00${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    
    console.log('Generated user_platform_id:', platformId)
    console.log('Auth user_id:', targetUserId)
    console.log()

    // Insert Tony into profiles
    // Note: Adjust the fields based on what columns actually exist
    const { data: insertedProfile, error: insertError } = await supabase
        .schema('master_data')
        .from('profiles')
        .insert({
            user_id: targetUserId,
            user_platform_id: platformId,
            email: targetEmail
        })
        .select()
    
    if (insertError) {
        console.error('❌ Error inserting profile:', insertError.message)
        console.log('\nYou may need to run SQL directly with the correct columns.')
        console.log('Example SQL:')
        console.log(`
INSERT INTO master_data.profiles (user_id, user_platform_id)
VALUES ('${targetUserId}', '${platformId}');
        `)
        return
    }

    console.log('✅ Successfully added Tony to profiles!')
    console.log(insertedProfile)
}

checkAndAddToProfiles()
    .then(() => {
        console.log('\n✅ Operation complete')
        process.exit(0)
    })
    .catch(err => {
        console.error('❌ Error:', err)
        process.exit(1)
    })
