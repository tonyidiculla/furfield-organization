import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role to check auth users
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function checkUsers() {
    console.log('🔍 Checking registered users...\n')

    try {
        const { data: { users }, error } = await supabase.auth.admin.listUsers()

        if (error) {
            console.log('❌ Error:', error.message)
            return
        }

        if (!users || users.length === 0) {
            console.log('⚠️  NO USERS REGISTERED')
            console.log('\nYou need to create an account first!')
            console.log('\n📝 To create an account:')
            console.log('   1. Go to: http://localhost:3001/auth/sign-up')
            console.log('   2. Register with your email and password')
            console.log('   3. Check your email for confirmation (if required)')
            console.log('   4. Then try signing in')
            console.log('\nOr create a user directly in Supabase Dashboard:')
            console.log('   Dashboard → Authentication → Users → Add user')
            return
        }

        console.log(`✅ Found ${users.length} registered user(s):\n`)

        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`)
            console.log(`   ID: ${user.id}`)
            console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
            console.log(`   Email Confirmed: ${user.email_confirmed_at ? '✅ Yes' : '❌ No - needs confirmation'}`)
            console.log(`   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`)
            console.log()
        })

        const unconfirmed = users.filter(u => !u.email_confirmed_at)
        if (unconfirmed.length > 0) {
            console.log('⚠️  Note: Users with unconfirmed emails might not be able to sign in')
            console.log('   depending on your Supabase email confirmation settings.')
        }

    } catch (err: any) {
        console.log('❌ Exception:', err.message)
    }
}

checkUsers().catch(console.error)
