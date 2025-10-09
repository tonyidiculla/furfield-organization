import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function inspectMasterData() {
    console.log('🔍 Inspecting master_data schema contents...\n')

    // Check platform_roles
    console.log('1️⃣ platform_roles table:')
    const { data: allRoles, error: rolesError, count } = await supabase
        .schema('master_data')
        .from('platform_roles')
        .select('*', { count: 'exact' })
        .limit(5)

    if (rolesError) {
        console.log('   ❌ Error:', rolesError.message)
    } else {
        console.log(`   Total rows: ${count}`)
        if (allRoles && allRoles.length > 0) {
            console.log(`   Sample data (first 5):`)
            allRoles.forEach((role: any, i) => {
                console.log(`\n   ${i + 1}. ${role.role_name || role.id}`)
                console.log(`      ID: ${role.id}`)
                console.log(`      Privilege Level: ${role.privilege_level}`)
                console.log(`      Is Active: ${role.is_active}`)
            })
        } else {
            console.log('   ⚠️  No rows found')
        }
    }

    // Check user_to_role_assignment
    console.log('\n2️⃣ user_to_role_assignment table:')
    const { data: allAssignments, error: assignError, count: assignCount } = await supabase
        .schema('master_data')
        .from('user_to_role_assignment')
        .select('*', { count: 'exact' })
        .limit(5)

    if (assignError) {
        console.log('   ❌ Error:', assignError.message)
    } else {
        console.log(`   Total rows: ${assignCount}`)
        if (allAssignments && allAssignments.length > 0) {
            console.log(`   Sample data (first 5):`)
            allAssignments.forEach((assign: any, i) => {
                console.log(`\n   ${i + 1}. User: ${assign.user_id}`)
                console.log(`      Role ID: ${assign.platform_role_id}`)
                console.log(`      Is Active: ${assign.is_active}`)
            })
        } else {
            console.log('   ⚠️  No rows found')
        }
    }

    console.log('\n' + '='.repeat(70))
    console.log('Summary:')
    console.log('- Schema is accessible ✅')
    console.log(`- platform_roles: ${count || 0} rows`)
    console.log(`- user_to_role_assignment: ${assignCount || 0} rows`)
    
    if ((count || 0) === 0) {
        console.log('\n💡 Your master_data schema appears to be empty.')
        console.log('   You may need to import the data from master_data_dump.sql.bkp')
    }
}

inspectMasterData().catch(console.error)
