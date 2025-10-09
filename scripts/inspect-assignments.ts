import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectAssignments() {
    console.log('🔍 Inspecting user_to_role_assignment table...\n')

    // Get ALL assignments (not filtered)
    const { data: allAssignments, error } = await supabase
        .schema('master_data')
        .from('user_to_role_assignment')
        .select('*')
        .limit(20)

    if (error) {
        console.log('❌ Error:', error.message)
        return
    }

    if (!allAssignments || allAssignments.length === 0) {
        console.log('⚠️  Table is EMPTY - no role assignments exist\n')
        console.log('The INSERT statement may not have worked.')
        console.log('Check for SQL errors in Supabase SQL Editor.')
        return
    }

    console.log(`✅ Found ${allAssignments.length} assignment(s) in table:\n`)

    allAssignments.forEach((assign: any, i) => {
        console.log(`${i + 1}. User ID: ${assign.user_id}`)
        console.log(`   Role ID: ${assign.platform_role_id}`)
        console.log(`   Is Active: ${assign.is_active}`)
        console.log(`   Created: ${assign.created_at || 'N/A'}`)
        console.log()
    })

    // Check specifically for Tony
    const tonyId = '89af6091-a4a9-41bc-ab83-a9184da9bbe4'
    const tonyAssignments = allAssignments.filter((a: any) => a.user_id === tonyId)
    
    if (tonyAssignments.length > 0) {
        console.log(`🎯 Found ${tonyAssignments.length} assignment(s) for tony@fusionduotech.com!`)
    } else {
        console.log(`⚠️  No assignments found for tony@fusionduotech.com (${tonyId})`)
    }
}

inspectAssignments().catch(console.error)
