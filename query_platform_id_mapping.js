const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function queryPlatformIdMapping() {
    console.log('Fetching platform_id_mapping data...\n')
    
    const { data, error } = await supabase
        .schema('master_data')
        .from('platform_id_mapping')
        .select('*')
        .order('category_code', { ascending: true })
        .order('type_code', { ascending: true })
    
    if (error) {
        console.error('❌ Error:', error.message)
        process.exit(1)
    }
    
    if (!data || data.length === 0) {
        console.log('No data found in platform_id_mapping table')
        process.exit(0)
    }
    
    console.log(`Found ${data.length} platform ID mapping entries\n`)
    console.log('='.repeat(100))
    
    // Group by category
    const grouped = {}
    data.forEach(row => {
        if (!grouped[row.category_code]) {
            grouped[row.category_code] = {
                name: row.category_name,
                description: row.category_description,
                types: []
            }
        }
        grouped[row.category_code].types.push({
            type_code: row.type_code,
            type_name: row.type_name,
            type_description: row.type_description
        })
    })
    
    // Display organized data
    Object.keys(grouped).sort().forEach(categoryCode => {
        const category = grouped[categoryCode]
        console.log(`\n📋 Category: ${categoryCode} - ${category.name}`)
        if (category.description) {
            console.log(`   Description: ${category.description}`)
        }
        console.log(`   Types:`)
        category.types.forEach(type => {
            console.log(`      ${categoryCode}${type.type_code} - ${type.type_name}`)
            if (type.type_description) {
                console.log(`         ${type.type_description}`)
            }
        })
    })
    
    console.log('\n' + '='.repeat(100))
    console.log('\n💡 Platform ID Format: [Category Code][Type Code][Sequential Number]')
    console.log('   Examples:')
    console.log('   - H00000001 = Human (H) + General Type (00) + ID (000001)')
    console.log('   - C00000001 = Company/Organization (C) + General Type (00) + ID (000001)')
    console.log('   - P00000001 = Pet (P) + General Type (00) + ID (000001)')
    
    process.exit(0)
}

queryPlatformIdMapping().catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
})
