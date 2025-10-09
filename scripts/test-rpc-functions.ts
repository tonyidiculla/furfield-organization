import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testRpcFunctions() {
    console.log('🧪 Testing RPC Functions...\n')
    console.log('=' .repeat(70))

    // Test 1: list_platform_roles
    console.log('\n1️⃣ Testing list_platform_roles()')
    console.log('─'.repeat(70))
    const { data: roles, error: rolesError } = await supabase.rpc('list_platform_roles')
    
    if (rolesError) {
        console.log('❌ Error:', rolesError.message)
        console.log('   This is expected if you haven\'t applied the migration yet.')
    } else {
        console.log(`✅ Success! Found ${roles?.length || 0} platform roles`)
        if (roles && roles.length > 0) {
            console.log('\n   Sample roles:')
            roles.slice(0, 5).forEach((role: any) => {
                console.log(`   • ${role.role_name} (Level ${role.privilege_level})`)
            })
            if (roles.length > 5) {
                console.log(`   ... and ${roles.length - 5} more`)
            }
        }
    }

    // Test 2: get_user_privileges (needs a user)
    console.log('\n2️⃣ Testing get_user_privileges(user_id)')
    console.log('─'.repeat(70))
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    let privileges: any = null
    
    if (userError || !user) {
        console.log('⚠️  No user signed in')
        console.log('   Sign in at http://localhost:3001/auth/sign-in to test this')
    } else {
        const { data: privData, error: privError } = await supabase.rpc('get_user_privileges', {
            user_id_param: user.id
        })
        privileges = privData
        
        if (privError) {
            console.log('❌ Error:', privError.message)
        } else if (!privileges || privileges.length === 0) {
            console.log('⚠️  No privileges found for user:', user.email)
            console.log('   You need to assign a role to this user in master_data.user_to_role_assignment')
            console.log('\n   Example SQL:')
            console.log(`   INSERT INTO master_data.user_to_role_assignment (user_id, platform_role_id, is_active)`)
            console.log(`   VALUES ('${user.id}',`)
            console.log(`           (SELECT id FROM master_data.platform_roles WHERE role_name = 'platform_admin'),`)
            console.log(`           true);`)
        } else {
            console.log(`✅ Success! User has ${privileges.length} active role(s)`)
            console.log(`   User: ${user.email}`)
            privileges.forEach((priv: any) => {
                console.log(`\n   Role: ${priv.role_name}`)
                console.log(`   Privilege Level: ${priv.privilege_level}`)
                if (priv.permissions) {
                    const permCount = Object.keys(priv.permissions).length
                    console.log(`   Permissions: ${permCount}`)
                }
                if (priv.modules) {
                    console.log(`   Modules: ${priv.modules.length}`)
                }
            })
        }
    }

    // Test 3: Check privilege level
    console.log('\n3️⃣ Testing user_has_privilege_level(user_id, level)')
    console.log('─'.repeat(70))
    
    if (!user) {
        console.log('⚠️  Skipped - no user signed in')
    } else {
        const { data: hasPriv, error: hasPrivError } = await supabase.rpc('user_has_privilege_level', {
            user_id_param: user.id,
            required_level: 2 // organization_admin
        })
        
        if (hasPrivError) {
            console.log('❌ Error:', hasPrivError.message)
        } else {
            console.log(`${hasPriv ? '✅' : '❌'} User ${hasPriv ? 'HAS' : 'DOES NOT HAVE'} organization_admin level privileges`)
        }
    }

    // Summary
    console.log('\n' + '='.repeat(70))
    console.log('\n📋 Summary')
    console.log('─'.repeat(70))
    
    if (rolesError) {
        console.log('❌ RPC functions are NOT available')
        console.log('\n📝 To fix this:')
        console.log('   1. Open Supabase Dashboard SQL Editor')
        console.log('   2. Run the migration: supabase/migrations/expose_master_data_via_rpc.sql')
        console.log('   3. See instructions: supabase/APPLY_MIGRATION.md')
    } else {
        console.log('✅ RPC functions are working!')
        
        if (!user) {
            console.log('\n📝 Next steps:')
            console.log('   1. Sign in at http://localhost:3001/auth/sign-in')
            console.log('   2. Assign yourself a role in the database')
            console.log('   3. Run this test again')
        } else if (!privileges || privileges.length === 0) {
            console.log('\n📝 Next step:')
            console.log('   Assign a role to your user in master_data.user_to_role_assignment')
        } else {
            console.log('\n🎉 Everything is working!')
            console.log('   Visit http://localhost:3001/organization to see your dashboard')
        }
    }
    
    console.log('\n' + '='.repeat(70))
}

testRpcFunctions().catch(console.error)
