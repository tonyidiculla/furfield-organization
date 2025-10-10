const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
    try {
        // Query information_schema using RPC or direct SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            query: `SELECT column_name, data_type, is_nullable 
                    FROM information_schema.columns 
                    WHERE table_schema = 'master_data' 
                    AND table_name = 'organizations' 
                    ORDER BY ordinal_position`
        })

        if (error) {
            console.error('RPC not available, trying direct query...')
            
            // Alternative: Try to select with limit 0 to get column names
            const { error: selectError } = await supabase
                .schema('master_data')
                .from('organizations')
                .select('*')
                .limit(0)
            
            if (selectError) {
                console.error('Error:', selectError.message)
                console.log('\nTrying to infer from organization_id...')
                
                // Last resort: try to get one record
                const { data: orgData, error: orgError } = await supabase
                    .from('organizations')
                    .select('*')
                    .limit(1)
                
                if (orgError) {
                    console.error('Cannot access organizations table:', orgError.message)
                    return
                }
                
                if (orgData && orgData.length > 0) {
                    analyzeColumns(orgData[0])
                } else {
                    console.log('No data available to determine columns')
                }
            }
            return
        }

        if (data) {
            console.log('\n=== Organizations Table Columns ===')
            data.forEach((col, idx) => {
                console.log(`${idx + 1}. ${col.column_name} (${col.data_type})`)
            })
            console.log(`\nTotal columns: ${data.length}`)
            
            // Check for our new fields
            console.log('\n=== New Fields Status ===')
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
            
            const existingColumns = data.map(c => c.column_name)
            newFields.forEach(field => {
                const exists = existingColumns.includes(field)
                console.log(`${field}: ${exists ? '✓ EXISTS' : '✗ MISSING'}`)
            })
        }
    } catch (err) {
        console.error('Exception:', err)
    }
}

function analyzeColumns(record) {
    console.log('\n=== Organizations Table Columns ===')
    const columns = Object.keys(record)
    columns.sort().forEach((col, idx) => {
        console.log(`${idx + 1}. ${col}`)
    })
    console.log(`\nTotal columns: ${columns.length}`)
    
    // Check for our new fields
    console.log('\n=== New Fields Status ===')
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
}

checkColumns()
