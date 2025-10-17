import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../furfield-auth-service/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkProfileColumns() {
  console.log('\n🔍 Checking profiles table structure...\n')
  
  const { data, error } = await supabase
    .schema('master_data')
    .from('profiles')
    .select('*')
    .limit(1)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('✅ Profiles table columns:')
    console.log(Object.keys(data[0]))
    console.log('\nSample row:')
    console.log(JSON.stringify(data[0], null, 2))
  }
}

checkProfileColumns()
