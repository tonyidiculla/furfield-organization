import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables FIRST before any imports
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Now import after env vars are loaded
import { fetchUserPrivileges } from '../src/lib/fetchUserPrivileges'

const targetUserId = '89af6091-a4a9-41bc-ab83-a9184da9bbe4'

async function testPrivilegeFetching() {
    console.log('🧪 Testing fetchUserPrivileges function...\n')
    console.log('User ID:', targetUserId)
    console.log()
    
    const privileges = await fetchUserPrivileges(targetUserId)
    
    if (!privileges) {
        console.error('❌ Failed to fetch privileges')
        return
    }
    
    console.log('✅ Successfully fetched privileges!\n')
    console.log('📊 Results:')
    console.log('   Roles:', privileges.roles.length)
    console.log('   Assignments:', privileges.assignments.length)
    console.log('   Highest Privilege Level:', privileges.highestPrivilegeLevel)
    console.log('   Total Permissions:', privileges.allPermissions.size)
    console.log('   Total Modules:', privileges.allModules.size)
    console.log()
    
    if (privileges.roles.length > 0) {
        console.log('🎭 Roles:')
        privileges.roles.forEach((role, i) => {
            console.log(`${i + 1}. ${role.role_name}`)
            console.log(`   Privilege Level: ${role.privilege_level}`)
            console.log(`   Permissions: ${role.permissions.length}`)
            console.log(`   Modules: ${role.modules.length}`)
        })
        console.log()
    }
    
    if (privileges.allPermissions.size > 0) {
        const perms = Array.from(privileges.allPermissions)
        console.log(`🔑 All Permissions (${perms.length}):`)
        console.log('  ', perms.slice(0, 10).join(', '))
        if (perms.length > 10) console.log('   ...and', perms.length - 10, 'more')
        console.log()
    }
    
    if (privileges.allModules.size > 0) {
        const mods = Array.from(privileges.allModules)
        console.log(`🧩 All Modules (${mods.length}):`)
        console.log('  ', mods.join(', '))
    }
}

testPrivilegeFetching()
    .then(() => {
        console.log('\n✅ Test complete')
        process.exit(0)
    })
    .catch(err => {
        console.error('❌ Error:', err)
        console.error(err.stack)
        process.exit(1)
    })
