import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkMyPrivileges() {
    console.log('🔍 Checking YOUR privilege level...\n')

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        console.log('❌ You are NOT signed in')
        console.log('\n📝 To check your privileges:')
        console.log('   1. Sign in at: http://localhost:3001/auth/sign-in')
        console.log('   2. Run this script again')
        return
    }

    console.log('✅ Signed in as:', user.email)
    console.log('   User ID:', user.id)
    console.log()

    // Check for role assignments
    const { data: assignments, error: assignError } = await supabase
        .schema('master_data')
        .from('user_to_role_assignment')
        .select(`
            *,
            platform_roles (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)

    if (assignError) {
        console.log('❌ Error fetching role assignments:', assignError.message)
        return
    }

    if (!assignments || assignments.length === 0) {
        console.log('⚠️  NO PRIVILEGE LEVEL ASSIGNED')
        console.log('\nYou have no active role assignments.')
        console.log('\n📝 To assign yourself a role, run this SQL in Supabase:')
        console.log(`
INSERT INTO master_data.user_to_role_assignment (user_id, platform_role_id, is_active)
VALUES (
  '${user.id}',
  (SELECT id FROM master_data.platform_roles WHERE role_name = 'platform_admin'),
  true
);`)
        console.log('\n💡 Note: You need to have roles in platform_roles table first!')
        return
    }

    console.log('🎯 YOUR PRIVILEGE LEVEL(S):\n')
    console.log('='.repeat(70))

    assignments.forEach((assignment: any, index) => {
        const role = assignment.platform_roles
        
        console.log(`\n${index + 1}. ${role.role_name}`)
        console.log(`   Privilege Level: ${role.privilege_level}`)
        console.log(`   Is Active: ${assignment.is_active}`)
        
        if (role.permissions) {
            const perms = Object.keys(role.permissions)
            console.log(`   Permissions: ${perms.length}`)
            if (perms.length > 0 && perms.length <= 5) {
                perms.forEach(p => console.log(`     • ${p}`))
            }
        }
        
        if (role.modules && Array.isArray(role.modules)) {
            console.log(`   Modules: ${role.modules.length}`)
            if (role.modules.length > 0 && role.modules.length <= 5) {
                role.modules.forEach((m: string) => console.log(`     • ${m}`))
            }
        }
    })

    // Find highest privilege
    const levels = assignments
        .map((a: any) => a.platform_roles?.privilege_level)
        .filter((l: any) => l != null)
    
    if (levels.length > 0) {
        const highest = Math.min(...levels)
        const highestRole = assignments.find((a: any) => a.platform_roles?.privilege_level === highest)
        
        console.log('\n' + '='.repeat(70))
        console.log('\n🏆 YOUR HIGHEST PRIVILEGE:')
        console.log(`   ${highestRole.platform_roles.role_name} (Level ${highest})`)
        
        const levelDescriptions: Record<number, string> = {
            1: '👑 PLATFORM ADMIN - Full platform control',
            2: '🏢 ORGANIZATION ADMIN - Manages organizations',
            3: '🏛️  ENTITY ADMIN - Entity-level administration',
            4: '👨‍⚕️ PROVIDER ADMIN - Provider management',
            5: '🩺 CLINICAL LEAD - Clinical oversight',
            6: '👨‍⚕️ PROVIDER - Healthcare provider',
            7: '🧑‍💼 FRONTDESK LEAD - Front desk supervision',
            8: '📦 INVENTORY LEAD - Inventory management',
            9: '💁 FRONTDESK - Reception staff',
            10: '📦 INVENTORY - Inventory staff',
            11: '📅 SCHEDULER - Appointment scheduling',
            12: '💰 BILLING - Billing operations',
            13: '👤 USER - Standard user'
        }
        
        if (levelDescriptions[highest]) {
            console.log(`   ${levelDescriptions[highest]}`)
        }
    }

    console.log('\n' + '='.repeat(70))
    console.log('\n✨ View your dashboard: http://localhost:3001/organization')
}

checkMyPrivileges().catch(console.error)
