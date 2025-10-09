const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
    console.log('Querying organizations table...\n')
    
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error:', error.message)
        process.exit(1)
    }

    if (!data || data.length === 0) {
        console.log('No data in organizations table')
        process.exit(0)
    }

    console.log('=== Organizations Table Columns ===')
    const columns = Object.keys(data[0]).sort()
    columns.forEach((col, idx) => {
        console.log(`${idx + 1}. ${col}`)
    })
    console.log(`\nTotal: ${columns.length} columns\n`)
    
    console.log('=== New Fields Status ===')
    const newFields = [
        'manager_name',
        'manager_email', 
        'manager_phone',
        'business_registration_number',
        'tax_identification_number',
        'incorporation_date',
        'business_type',
        'primary_color',
        'secondary_color',
        'theme_preference'
    ]
    
    newFields.forEach(field => {
        const exists = columns.includes(field)
        console.log(`${field}: ${exists ? '✓ EXISTS' : '✗ MISSING'}`)
    })
    
    process.exit(0)
}

checkColumns().catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
})
