import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
})

async function checkPermissions() {
    const client = await pool.connect()
    
    try {
        console.log('🔍 Checking master_data schema permissions...\n')

        // Check schema exposure
        console.log('1️⃣ Checking if master_data is in exposed schemas:')
        const { rows: schemaRows } = await client.query(`
            SELECT schema_name
            FROM information_schema.schemata
            WHERE schema_name = 'master_data'
        `)
        
        if (schemaRows.length > 0) {
            console.log('   ✅ master_data schema exists')
        } else {
            console.log('   ❌ master_data schema not found')
            return
        }

        // Check schema privileges
        console.log('\n2️⃣ Checking schema USAGE privileges:')
        const { rows: usageRows } = await client.query(`
            SELECT 
                grantee,
                privilege_type
            FROM information_schema.schema_privileges
            WHERE schema_name = 'master_data'
                AND grantee IN ('anon', 'authenticated', 'service_role', 'postgres')
            ORDER BY grantee, privilege_type
        `)
        
        if (usageRows.length > 0) {
            usageRows.forEach(row => {
                console.log(`   • ${row.grantee}: ${row.privilege_type}`)
            })
        } else {
            console.log('   ❌ No USAGE privileges granted to anon/authenticated/service_role')
        }

        // Check table privileges
        console.log('\n3️⃣ Checking table privileges:')
        const { rows: tableRows } = await client.query(`
            SELECT 
                schemaname,
                tablename,
                grantee,
                array_agg(privilege_type ORDER BY privilege_type) as privileges
            FROM information_schema.table_privileges
            WHERE schemaname = 'master_data'
                AND grantee IN ('anon', 'authenticated', 'service_role', 'postgres')
            GROUP BY schemaname, tablename, grantee
            ORDER BY tablename, grantee
        `)
        
        if (tableRows.length > 0) {
            let currentTable = ''
            tableRows.forEach(row => {
                if (row.tablename !== currentTable) {
                    console.log(`\n   Table: ${row.tablename}`)
                    currentTable = row.tablename
                }
                console.log(`   • ${row.grantee}: ${row.privileges.join(', ')}`)
            })
        } else {
            console.log('   ❌ No table privileges found')
        }

        // Check search_path
        console.log('\n4️⃣ Checking search_path configuration:')
        const { rows: pathRows } = await client.query(`
            SELECT 
                rolname,
                rolconfig
            FROM pg_roles
            WHERE rolname IN ('anon', 'authenticated', 'service_role')
            ORDER BY rolname
        `)
        
        pathRows.forEach(row => {
            const config = row.rolconfig || []
            const searchPath = config.find((c: string) => c.startsWith('search_path='))
            console.log(`   • ${row.rolname}: ${searchPath || 'Not set'}`)
        })

        // Summary
        console.log('\n' + '='.repeat(70))
        console.log('📋 Summary & Next Steps')
        console.log('='.repeat(70))

        const hasUsage = usageRows.some(r => ['anon', 'authenticated'].includes(r.grantee))
        const hasTablePrivs = tableRows.some(r => ['anon', 'authenticated'].includes(r.grantee))
        const hasSearchPath = pathRows.some(r => {
            const config = r.rolconfig || []
            return config.some((c: string) => c.includes('master_data'))
        })

        if (hasUsage && hasTablePrivs && hasSearchPath) {
            console.log('\n✅ master_data schema is fully accessible!')
            console.log('   You can now query it through Supabase API')
        } else {
            console.log('\n⚠️  Additional configuration needed:')
            if (!hasUsage) {
                console.log('   ❌ Missing USAGE privilege on schema')
            }
            if (!hasTablePrivs) {
                console.log('   ❌ Missing SELECT privileges on tables')
            }
            if (!hasSearchPath) {
                console.log('   ❌ master_data not in search_path')
            }
            
            console.log('\n📝 Run this SQL in Supabase SQL Editor:')
            console.log('   File: supabase/migrations/grant_master_data_access.sql')
        }

    } catch (error: any) {
        console.error('\n❌ Error:', error.message)
    } finally {
        client.release()
        await pool.end()
    }
}

checkPermissions().catch(console.error)
