import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkOrganizationTables() {
    console.log('🔍 Checking for organization-related tables in master_data schema...\n')
    
    // Try to find organization tables
    const possibleTables = [
        'organizations',
        'organisation',
        'organization',
        'org',
        'company',
        'companies',
        'business'
    ]
    
    for (const tableName of possibleTables) {
        const { data, error } = await supabase
            .schema('master_data')
            .from(tableName)
            .select('*')
            .limit(1)
        
        if (!error) {
            console.log(`✅ Found table: master_data.${tableName}`)
            if (data && data.length > 0) {
                console.log('   Columns:', Object.keys(data[0]))
                console.log('   Sample:', data[0])
            }
            console.log()
        }
    }
    
    // Also check public schema
    console.log('🔍 Checking public schema...\n')
    
    for (const tableName of possibleTables) {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)
        
        if (!error) {
            console.log(`✅ Found table: public.${tableName}`)
            if (data && data.length > 0) {
                console.log('   Columns:', Object.keys(data[0]))
                console.log('   Sample:', data[0])
            }
            console.log()
        }
    }
}

checkOrganizationTables()
    .then(() => {
        console.log('✅ Check complete')
        process.exit(0)
    })
    .catch(err => {
        console.error('❌ Error:', err)
        process.exit(1)
    })
