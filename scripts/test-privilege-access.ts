import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testPrivilegeAccess() {
    console.log('🎯 Testing Privilege System Access\n')
    console.log('='.repeat(70))

    // Test 1: List all platform roles
    console.log('\n1️⃣ Fetching all platform roles from master_data...')
    const { data: roles, error: rolesError } = await supabase
        .schema('master_data')
        .from('platform_roles')
        .select('id, role_name, privilege_level')
        .eq('is_active', true)
        .order('privilege_level')
        .limit(10)

    if (rolesError) {
        console.log('   ❌ Error:', rolesError.message)
    } else {
        console.log(`   ✅ Success! Found ${roles?.length || 0} active roles`)
        if (roles && roles.length > 0) {
            console.log('\n   Top roles by privilege level:')
            roles.forEach((role: any) => {
                console.log(`   ${role.privilege_level}. ${role.role_name}`)
            })
        }
    }

    // Test 2: Check if we can query user role assignments
    console.log('\n2️⃣ Testing user_to_role_assignment table access...')
    const { data: assignments, error: assignmentsError } = await supabase
        .schema('master_data')
        .from('user_to_role_assignment')
        .select('user_id, platform_role_id, is_active')
        .eq('is_active', true)
        .limit(5)

    if (assignmentsError) {
        console.log('   ❌ Error:', assignmentsError.message)
    } else {
        console.log(`   ✅ Success! Found ${assignments?.length || 0} active assignments`)
        if (assignments && assignments.length > 0) {
            console.log(`   ${assignments.length} user(s) have role assignments`)
        }
    }

    // Test 3: Check current user (if signed in)
    console.log('\n3️⃣ Checking current user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    let userAssignments: any = null
    
    if (userError || !user) {
        console.log('   ⚠️  No user currently signed in')
        console.log('   Sign in at http://localhost:3001/auth/sign-in to test user-specific queries')
    } else {
        console.log(`   ✅ Signed in as: ${user.email}`)
        
        // Test fetching this user's privileges
        console.log('\n4️⃣ Fetching your role assignments...')
        const { data: userAssignData, error: userAssignError } = await supabase
            .schema('master_data')
            .from('user_to_role_assignment')
            .select(`
                *,
                platform_roles (
                    id,
                    role_name,
                    privilege_level,
                    permissions,
                    modules
                )
            `)
            .eq('user_id', user.id)
            .eq('is_active', true)
        
        userAssignments = userAssignData

        if (userAssignError) {
            console.log('   ❌ Error:', userAssignError.message)
        } else if (!userAssignments || userAssignments.length === 0) {
            console.log('   ⚠️  No role assignments found for your user')
            console.log('\n   To assign yourself a role, run this SQL:')
            console.log(`   INSERT INTO master_data.user_to_role_assignment (user_id, platform_role_id, is_active)`)
            console.log(`   VALUES ('${user.id}',`)
            console.log(`           (SELECT id FROM master_data.platform_roles WHERE role_name = 'platform_admin'),`)
            console.log(`           true);`)
        } else {
            console.log(`   ✅ Found ${userAssignments.length} role(s)!`)
            userAssignments.forEach((assignment: any) => {
                const role = assignment.platform_roles
                console.log(`\n   • ${role.role_name}`)
                console.log(`     Privilege Level: ${role.privilege_level}`)
                if (role.permissions) {
                    console.log(`     Permissions: ${Object.keys(role.permissions).length}`)
                }
                if (role.modules) {
                    console.log(`     Modules: ${role.modules.length}`)
                }
            })
        }
    }

    // Summary
    console.log('\n' + '='.repeat(70))
    console.log('📋 Summary')
    console.log('='.repeat(70))
    
    if (!rolesError && !assignmentsError) {
        console.log('\n✅ master_data schema is fully accessible!')
        console.log('✅ Direct schema access is working')
        console.log('✅ Your privilege system is operational')
        
        if (user && userAssignments && userAssignments.length > 0) {
            console.log('\n🎉 Everything is working perfectly!')
            console.log('   Visit http://localhost:3001/organization to see your dashboard')
        } else if (user) {
            console.log('\n📝 Next step: Assign yourself a role (see SQL above)')
        } else {
            console.log('\n📝 Next step: Sign in to test user-specific privileges')
        }
    } else {
        console.log('\n⚠️  Some queries failed - check errors above')
    }
    
    console.log('\n' + '='.repeat(70))
}

testPrivilegeAccess().catch(console.error)
