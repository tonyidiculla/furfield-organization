#!/usr/bin/env node

/**
 * Script to query all functions from Supabase database
 * Run: node check-database-functions.js
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xnetjsifkhtbbpadwlxy.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZXRqc2lma2h0YmJwYWR3bHh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMDcyMjgsImV4cCI6MjA0OTU4MzIyOH0.M9vYKhqLNZPOCLxZxW3LpPOsH8mM8qLpFLrHzG8VYxQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function queryFunctions() {
    console.log('🔍 Querying database functions...\n')

    // Query using SQL
    const { data, error } = await supabase.rpc('execute_sql', {
        query: `
            SELECT 
                n.nspname as schema_name,
                p.proname as function_name,
                pg_get_function_identity_arguments(p.oid) as arguments
            FROM pg_proc p
            LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname IN ('public', 'master_data')
                AND p.prokind = 'f'
            ORDER BY n.nspname, p.proname;
        `
    })

    if (error) {
        console.error('❌ Error querying functions:', error)
        console.log('\n📝 Please run the SQL query manually in Supabase SQL Editor:')
        console.log('   File: supabase/query_all_functions.sql')
        return
    }

    console.log('✅ Functions in database:\n')
    console.log(data)
}

// Alternative: List expected functions
async function checkExpectedFunctions() {
    console.log('🔍 Checking expected functions...\n')

    const expectedFunctions = [
        { schema: 'master_data', name: 'generate_entity_platform_id', args: '' },
        { schema: 'master_data', name: 'generate_organization_platform_id', args: '' },
        { schema: 'public', name: 'get_user_privileges', args: 'user_id_param uuid' },
        { schema: 'public', name: 'get_platform_role', args: 'role_id_param uuid' },
        { schema: 'public', name: 'list_platform_roles', args: '' },
        { schema: 'public', name: 'user_has_privilege_level', args: 'user_id_param uuid, required_level integer' },
        { schema: 'public', name: 'user_has_permission', args: 'user_id_param uuid, permission_name text' },
        { schema: 'public', name: 'user_has_module', args: 'user_id_param uuid, module_name text' },
        { schema: 'public', name: 'assign_role_to_user', args: 'user_platform_id_param text, role_id_param uuid, organization_id_param uuid, assigned_by_param uuid' },
        { schema: 'public', name: 'revoke_role_from_user', args: 'user_platform_id_param text, role_id_param uuid, organization_id_param uuid, revoked_by_param uuid' },
        { schema: 'public', name: 'get_hms_modules', args: '' }, // Should NOT exist
    ]

    console.log('📋 Expected functions:\n')
    
    for (const func of expectedFunctions) {
        const shouldExist = func.name !== 'get_hms_modules'
        const status = shouldExist ? '✅ Should exist' : '❌ Should NOT exist'
        console.log(`${status}: ${func.schema}.${func.name}(${func.args})`)
    }

    console.log('\n💡 To verify actual functions, run the SQL in: supabase/query_all_functions.sql')
}

checkExpectedFunctions()
