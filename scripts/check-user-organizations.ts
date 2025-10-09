import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const targetUserId = '89af6091-a4a9-41bc-ab83-a9184da9bbe4'
const userPlatformId = 'H00000001'

async function checkUserOrganizations() {
    console.log('🔍 Checking organizations for user...\n')
    console.log('Auth User ID:', targetUserId)
    console.log('Platform ID:', userPlatformId)
    console.log()
    
    // Try different possible owner columns
    const queries = [
        { field: 'owner_id', value: targetUserId, description: 'by auth user_id' },
        { field: 'user_platform_id', value: userPlatformId, description: 'by user_platform_id' },
        { field: 'created_by', value: targetUserId, description: 'by created_by (auth)' },
        { field: 'created_by', value: userPlatformId, description: 'by created_by (platform)' },
    ]
    
    for (const query of queries) {
        console.log(`📋 Querying ${query.description}...`)
        const { data, error } = await supabase
            .schema('master_data')
            .from('organizations')
            .select('*')
            .eq(query.field, query.value)
        
        if (!error && data && data.length > 0) {
            console.log(`   ✅ Found ${data.length} organization(s)`)
            data.forEach(org => {
                console.log(`      - ${org.name || org.organization_name || org.id}`)
            })
        } else if (error) {
            console.log(`   ⚠️  Error: ${error.message}`)
        } else {
            console.log(`   ℹ️  No results`)
        }
        console.log()
    }
    
    // List all organizations to see what's there
    console.log('📋 Listing ALL organizations in table...')
    const { data: allOrgs, error: allError } = await supabase
        .schema('master_data')
        .from('organizations')
        .select('*')
        .limit(10)
    
    if (allError) {
        console.error('   ❌ Error:', allError.message)
    } else if (allOrgs && allOrgs.length > 0) {
        console.log(`   ✅ Total: ${allOrgs.length}`)
        allOrgs.forEach((org, i) => {
            console.log(`   ${i + 1}. ${org.name || org.organization_name || org.id}`)
            console.log(`      Columns:`, Object.keys(org).join(', '))
        })
    } else {
        console.log('   ℹ️  Table is empty')
    }
}

checkUserOrganizations()
    .then(() => {
        console.log('\n✅ Check complete')
        process.exit(0)
    })
    .catch(err => {
        console.error('❌ Error:', err)
        process.exit(1)
    })
