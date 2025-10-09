import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    // Force IPv4
    options: '-c search_path=public,master_data'
})

async function findMyPrivileges() {
    const client = await pool.connect()
    
    try {
        console.log('🔍 Finding your privilege assignments...\n')

        // Query all active role assignments with their roles
        const result = await client.query(`
            SELECT 
                ura.user_id,
                ura.created_at as assigned_at,
                ura.expires_at,
                pr.id as role_id,
                pr.role_name,
                pr.privilege_level,
                pr.permissions,
                pr.modules
            FROM master_data.user_to_role_assignment ura
            JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
            WHERE ura.is_active = true
            ORDER BY ura.user_id, pr.privilege_level
        `)

        if (result.rows.length === 0) {
            console.log('⚠️  No active role assignments found in master_data.user_to_role_assignment')
            console.log('\n💡 To assign yourself a role, run SQL like:')
            console.log(`
INSERT INTO master_data.user_to_role_assignment (user_id, platform_role_id, is_active)
VALUES 
  ('YOUR_USER_ID', (SELECT id FROM master_data.platform_roles WHERE role_name = 'platform_admin'), true);
            `)
            return
        }

        console.log(`Found ${result.rows.length} active role assignment(s):\n`)
        console.log('='.repeat(90))

        // Group by user_id
        const byUser = new Map<string, typeof result.rows>()
        result.rows.forEach((row) => {
            if (!byUser.has(row.user_id)) {
                byUser.set(row.user_id, [])
            }
            byUser.get(row.user_id)!.push(row)
        })

        // Get auth users to match emails
        const userIds = Array.from(byUser.keys())
        const usersResult = await client.query(`
            SELECT id, email, created_at
            FROM auth.users
            WHERE id = ANY($1)
        `, [userIds])

        const userEmails = new Map(usersResult.rows.map(u => [u.id, u]))

        byUser.forEach((userRoles, userId) => {
            const userInfo = userEmails.get(userId)
            
            console.log(`\n👤 User: ${userInfo?.email || 'Unknown'}`)
            console.log(`   ID: ${userId}`)
            if (userInfo) {
                console.log(`   Account Created: ${new Date(userInfo.created_at).toLocaleDateString()}`)
            }
            console.log(`   Role Assignments: ${userRoles.length}\n`)

            userRoles.forEach((role, index) => {
                console.log(`   ${index + 1}. ${role.role_name}`)
                console.log(`      Privilege Level: ${role.privilege_level}`)
                console.log(`      Assigned: ${new Date(role.assigned_at).toLocaleDateString()}`)
                
                if (role.expires_at) {
                    const expiryDate = new Date(role.expires_at)
                    const isExpired = expiryDate < new Date()
                    console.log(`      Expires: ${expiryDate.toLocaleDateString()} ${isExpired ? '⚠️  EXPIRED' : ''}`)
                }

                if (role.permissions && typeof role.permissions === 'object') {
                    const permissionsList = Object.keys(role.permissions)
                    if (permissionsList.length > 0) {
                        console.log(`      Permissions: ${permissionsList.length} total`)
                        permissionsList.slice(0, 3).forEach(p => console.log(`        • ${p}`))
                        if (permissionsList.length > 3) {
                            console.log(`        ... and ${permissionsList.length - 3} more`)
                        }
                    }
                }

                if (role.modules && Array.isArray(role.modules) && role.modules.length > 0) {
                    console.log(`      Modules: ${role.modules.length} total`)
                    role.modules.slice(0, 3).forEach(m => console.log(`        • ${m}`))
                    if (role.modules.length > 3) {
                        console.log(`        ... and ${role.modules.length - 3} more`)
                    }
                }

                console.log()
            })

            // Find highest privilege for this user
            const privilegeLevels = userRoles.map(r => r.privilege_level).filter(Boolean)
            
            if (privilegeLevels.length > 0) {
                const highest = Math.min(...privilegeLevels)
                const highestRole = userRoles.find(r => r.privilege_level === highest)
                
                console.log('   🏆 YOUR HIGHEST PRIVILEGE LEVEL:')
                console.log(`      ${highestRole?.role_name} (Level ${highest})`)
                
                // Show what this level means
                const levelDescriptions: Record<number, string> = {
                    1: '🔴 Platform Admin - Full platform control',
                    2: '🟠 Organization Admin - Manages organizations',
                    3: '🟡 Entity Admin - Entity-level administration',
                    4: '🟢 Provider Admin - Provider management',
                    5: '🔵 Clinical Lead - Clinical oversight',
                    6: '🟣 Provider - Healthcare providers',
                    7: '🟤 Frontdesk Lead - Front desk supervision',
                    8: '⚫ Inventory Lead - Inventory management',
                    9: '⚪ Frontdesk - Reception staff',
                    10: '🔘 Inventory - Inventory staff',
                    11: '🔸 Scheduler - Appointment scheduling',
                    12: '🔹 Billing - Billing operations',
                    13: '⬜ User - Standard user'
                }
                
                if (levelDescriptions[highest]) {
                    console.log(`      ${levelDescriptions[highest]}`)
                }

                // Count total unique permissions and modules
                const allPermissions = new Set<string>()
                const allModules = new Set<string>()
                
                userRoles.forEach(role => {
                    if (role.permissions && typeof role.permissions === 'object') {
                        Object.keys(role.permissions).forEach(p => allPermissions.add(p))
                    }
                    if (role.modules && Array.isArray(role.modules)) {
                        role.modules.forEach(m => allModules.add(m))
                    }
                })

                console.log(`\n   📊 Total Unique Permissions: ${allPermissions.size}`)
                console.log(`   📦 Total Unique Modules: ${allModules.size}`)
            }

            console.log('\n' + '='.repeat(90))
        })

        console.log('\n✨ To see this in the UI:')
        console.log('   1. Sign in at http://localhost:3001/auth/sign-in')
        console.log('   2. Visit http://localhost:3001/organization')

    } finally {
        client.release()
        await pool.end()
    }
}

findMyPrivileges().catch(console.error)
