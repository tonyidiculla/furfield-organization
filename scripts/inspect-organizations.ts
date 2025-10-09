import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectOrganizations() {
    console.log('🔍 Inspecting organizations table...\n')
    
    const { data, error } = await supabase
        .schema('master_data')
        .from('organizations')
        .select('*')
        .limit(5)
    
    if (error) {
        console.error('❌ Error:', error.message)
        return
    }

    console.log(`✅ Found ${data?.length || 0} organizations\n`)
    
    if (data && data.length > 0) {
        console.log('📋 Columns:', Object.keys(data[0]).join(', '))
        console.log('\n📊 Sample data:\n')
        data.forEach((org, i) => {
            console.log(`${i + 1}. ${org.name || org.organization_name || org.id}`)
            console.log(`   ID: ${org.id}`)
            if (org.owner_id) console.log(`   Owner ID: ${org.owner_id}`)
            if (org.user_platform_id) console.log(`   User Platform ID: ${org.user_platform_id}`)
            if (org.created_by) console.log(`   Created By: ${org.created_by}`)
            console.log()
        })
    } else {
        console.log('⚠️  No organizations found in the table')
    }
}

inspectOrganizations()
    .then(() => {
        console.log('✅ Inspection complete')
        process.exit(0)
    })
    .catch(err => {
        console.error('❌ Error:', err)
        process.exit(1)
    })
