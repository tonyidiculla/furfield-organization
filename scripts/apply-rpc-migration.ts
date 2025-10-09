import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
})

async function applyMigration() {
    const client = await pool.connect()
    
    try {
        console.log('🚀 Applying RPC functions migration...\n')

        // Read the migration file
        const migrationPath = path.resolve(
            process.cwd(),
            'supabase/migrations/expose_master_data_via_rpc.sql'
        )
        
        if (!fs.existsSync(migrationPath)) {
            console.error('❌ Migration file not found:', migrationPath)
            return
        }

        const migrationSql = fs.readFileSync(migrationPath, 'utf-8')

        console.log('📄 Executing migration SQL...')
        await client.query(migrationSql)

        console.log('\n✅ Migration applied successfully!\n')
        console.log('📋 Created RPC functions:')
        console.log('   • get_user_privileges(user_id)')
        console.log('   • get_platform_role(role_id)')
        console.log('   • list_platform_roles()')
        console.log('   • user_has_privilege_level(user_id, level)')
        console.log('   • user_has_permission(user_id, permission)')
        console.log('   • user_has_module(user_id, module)')
        console.log('   • assign_role_to_user(user_id, role_id, expires_at)')
        console.log('   • revoke_role_from_user(user_id, role_id)')
        console.log('\n🔒 Security:')
        console.log('   • Functions use SECURITY DEFINER')
        console.log('   • Granted to authenticated users only')
        console.log('   • Admin functions require privilege level ≤ 2')
        console.log('\n🎯 Next steps:')
        console.log('   1. Assign yourself a role in the database')
        console.log('   2. Sign in at http://localhost:3001/auth/sign-in')
        console.log('   3. Visit http://localhost:3001/organization')

        // Verify the functions were created
        const { rows } = await client.query(`
            SELECT 
                routine_name,
                routine_type
            FROM information_schema.routines
            WHERE routine_schema = 'public'
                AND routine_name LIKE '%privilege%' 
                OR routine_name LIKE '%role%'
            ORDER BY routine_name
        `)

        if (rows.length > 0) {
            console.log('\n✅ Verified functions in database:')
            rows.forEach(row => {
                console.log(`   • ${row.routine_name} (${row.routine_type})`)
            })
        }

    } catch (error: any) {
        console.error('\n❌ Error applying migration:', error.message)
        if (error.detail) {
            console.error('   Detail:', error.detail)
        }
        if (error.hint) {
            console.error('   Hint:', error.hint)
        }
    } finally {
        client.release()
        await pool.end()
    }
}

applyMigration().catch(console.error)
