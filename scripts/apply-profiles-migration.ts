import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
    console.log('🔧 Applying migration: Add user_id to profiles\n')
    
    // Read the migration file
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20250108_add_user_id_to_profiles.sql')
    const sql = fs.readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 Migration SQL:')
    console.log(sql)
    console.log()
    
    console.log('⚠️  Note: This requires direct PostgreSQL access.')
    console.log('Please run this SQL in your Supabase SQL Editor:\n')
    console.log('https://supabase.com/dashboard/project/xnetjsifkhtbbpadwlxy/sql/new\n')
    console.log('Or use the Supabase CLI:')
    console.log('supabase db push\n')
}

applyMigration()
    .then(() => {
        console.log('✅ Instructions provided')
        process.exit(0)
    })
    .catch(err => {
        console.error('❌ Error:', err)
        process.exit(1)
    })
