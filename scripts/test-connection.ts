import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('🔍 Testing Supabase Connection...\n')
console.log('URL:', supabaseUrl)
console.log('Anon Key:', supabaseAnonKey?.substring(0, 20) + '...')
console.log()

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
    console.log('1️⃣ Testing basic connection...')
    
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .limit(1)
        
        if (error) {
            console.log('   Error:', error.message)
            console.log('   Code:', error.code)
            console.log('   Details:', error.details)
            console.log('   Hint:', error.hint)
        } else {
            console.log('   ✅ Connection works!')
        }
    } catch (err: any) {
        console.log('   ❌ Exception:', err.message)
    }

    console.log('\n2️⃣ Testing master_data schema...')
    
    try {
        const { data, error } = await supabase
            .schema('master_data')
            .from('platform_roles')
            .select('*')
            .limit(1)
        
        if (error) {
            console.log('   Error:', error.message)
            console.log('   Code:', error.code)
            if (error.details) console.log('   Details:', error.details)
            if (error.hint) console.log('   Hint:', error.hint)
        } else {
            console.log('   ✅ master_data accessible!')
            console.log('   Rows:', data?.length || 0)
        }
    } catch (err: any) {
        console.log('   ❌ Exception:', err.message)
    }

    console.log('\n3️⃣ Testing auth...')
    
    try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
            console.log('   Error:', error.message)
            if (error.message.includes('invalid') || error.message.includes('credentials')) {
                console.log('\n   ⚠️  This is expected - no session in this script context')
            }
        } else if (!user) {
            console.log('   ℹ️  No user signed in (expected)')
        } else {
            console.log('   ✅ User:', user.email)
        }
    } catch (err: any) {
        console.log('   ❌ Exception:', err.message)
    }
}

testConnection().catch(console.error)
