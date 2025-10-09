import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const targetEmail = 'tony@fusionduotech.com'
const targetUserId = '89af6091-a4a9-41bc-ab83-a9184da9bbe4'

async function investigateUserPlatformId() {
    console.log('🔍 Investigating user_platform_id relationship\n')
    
    // Check all assignments
    console.log('📋 Fetching all assignments...')
    const { data: assignments, error } = await supabase
        .schema('master_data')
        .from('user_to_role_assignment')
        .select('user_id, user_platform_id, platform_role_id, is_active')
        .limit(20)
    
    if (error) {
        console.error('❌ Error:', error)
        return
    }

    console.log(`   ✅ Found ${assignments?.length || 0} assignments\n`)
    
    if (assignments && assignments.length > 0) {
        console.log('Sample data:')
        assignments.slice(0, 5).forEach((a, i) => {
            console.log(`${i + 1}.`)
            console.log(`   user_id: ${a.user_id || 'NULL'}`)
            console.log(`   user_platform_id: ${a.user_platform_id}`)
            console.log(`   platform_role_id: ${a.platform_role_id}`)
            console.log(`   is_active: ${a.is_active}`)
            console.log()
        })
        
        // Check if user_id ever matches user_platform_id
        const matchingIds = assignments.filter(a => a.user_id === a.user_platform_id)
        console.log(`\n🔎 Assignments where user_id === user_platform_id: ${matchingIds.length}`)
        
        // Check if Tony's auth ID appears anywhere
        const tonyInUserId = assignments.filter(a => a.user_id === targetUserId)
        const tonyInPlatformId = assignments.filter(a => a.user_platform_id === targetUserId)
        
        console.log(`\n👤 Tony's auth ID (${targetUserId}):`)
        console.log(`   Found in user_id column: ${tonyInUserId.length}`)
        console.log(`   Found in user_platform_id column: ${tonyInPlatformId.length}`)
    }
}

investigateUserPlatformId()
    .then(() => {
        console.log('\n✅ Investigation complete')
        process.exit(0)
    })
    .catch(err => {
        console.error('❌ Error:', err)
        process.exit(1)
    })
