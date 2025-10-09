import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkOrganization() {
    const { data, error } = await supabase
        .schema('master_data')
        .from('organizations')
        .select('*')
        .eq('id', 'a0c7b13a-1a45-496d-a8db-83d2847ac981')
        .single()

    console.log('Organization record:')
    console.log(JSON.stringify(data, null, 2))
    
    if (error) {
        console.error('Error:', error)
    }
}

checkOrganization()
