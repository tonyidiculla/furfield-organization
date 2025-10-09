import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testSchemaAccess() {
    console.log('🔍 Testing schema access...\n')

    // Test with anon key
    const anonClient = createClient(supabaseUrl, supabaseAnonKey)

    console.log('1️⃣ Testing PUBLIC schema access (with anon key):')
    const { data: publicTest, error: publicError } = await anonClient
        .from('profiles')
        .select('*')
        .limit(1)

    if (publicError) {
        console.log('   ❌ Error:', publicError.message)
    } else {
        console.log('   ✅ Public schema accessible')
    }

    console.log('\n2️⃣ Testing MASTER_DATA schema access (with anon key):')
    const { data: masterDataTest1, error: masterDataError1 } = await anonClient
        .schema('master_data')
        .from('platform_roles')
        .select('*')
        .limit(1)

    if (masterDataError1) {
        console.log('   ❌ Error:', masterDataError1.message)
        console.log('   Code:', masterDataError1.code)
    } else {
        console.log('   ✅ Master_data schema accessible with anon key!')
    }

    // Test with service role key
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    console.log('\n3️⃣ Testing MASTER_DATA schema access (with service role key):')
    const { data: masterDataTest2, error: masterDataError2 } = await serviceClient
        .schema('master_data')
        .from('platform_roles')
        .select('*')
        .limit(1)

    if (masterDataError2) {
        console.log('   ❌ Error:', masterDataError2.message)
        console.log('   Code:', masterDataError2.code)
    } else {
        console.log('   ✅ Master_data schema accessible with service role!')
        if (masterDataTest2 && masterDataTest2.length > 0) {
            console.log('   Sample role:', masterDataTest2[0].role_name)
        }
    }

    console.log('\n📋 Summary:')
    console.log('─'.repeat(60))
    console.log('To expose the master_data schema through PostgREST API:')
    console.log('1. Go to Supabase Dashboard → Project Settings → API')
    console.log('2. Look for "Exposed schemas" setting')
    console.log('3. Add "master_data" to the list of exposed schemas')
    console.log('4. Or run this SQL in the SQL Editor:')
    console.log('')
    console.log('ALTER ROLE anon SET search_path TO public, master_data;')
    console.log('ALTER ROLE authenticated SET search_path TO public, master_data;')
    console.log('NOTIFY pgrst, \'reload config\';')
    console.log('─'.repeat(60))
}

testSchemaAccess().catch(console.error)
