const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrganizations() {
    console.log('Checking organizations in database...\n')
    
    // Check the organization we just updated
    console.log('=== Checking specific organization ===')
    const { data: org, error: orgError } = await supabase
        .schema('master_data')
        .from('organizations')
        .select('organization_id, organization_name, owner_platform_id, is_active, secondary_color')
        .eq('organization_id', '639e9d01-756f-4776-80ed-075e5cedefb6')
        .single()
    
    if (orgError) {
        console.error('❌ Error fetching organization:', orgError.message)
    } else {
        console.log('✅ Organization found:')
        console.log('   ID:', org.organization_id)
        console.log('   Name:', org.organization_name)
        console.log('   Owner Platform ID:', org.owner_platform_id)
        console.log('   Status:', org.is_active)
        console.log('   Secondary Color:', org.secondary_color)
    }
    
    // Check all organizations
    console.log('\n=== Checking all organizations ===')
    const { data: allOrgs, error: allError } = await supabase
        .schema('master_data')
        .from('organizations')
        .select('organization_id, organization_name, owner_platform_id, is_active')
    
    if (allError) {
        console.error('❌ Error fetching all organizations:', allError.message)
    } else {
        console.log(`Found ${allOrgs?.length || 0} total organizations`)
        allOrgs?.forEach((o, idx) => {
            console.log(`   ${idx + 1}. ${o.organization_name} (${o.is_active})`)
        })
    }
    
    // Check with the owner_platform_id filter
    console.log('\n=== Checking with owner filter (H00000001) ===')
    const { data: filteredOrgs, error: filterError } = await supabase
        .schema('master_data')
        .from('organizations')
        .select('*')
        .eq('owner_platform_id', 'H00000001')
        .eq('is_active', 'active')
    
    if (filterError) {
        console.error('❌ Error with filter:', filterError.message)
    } else {
        console.log(`Found ${filteredOrgs?.length || 0} organizations for owner H00000001`)
        filteredOrgs?.forEach((o, idx) => {
            console.log(`   ${idx + 1}. ${o.organization_name}`)
        })
    }
    
    process.exit(0)
}

checkOrganizations().catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
})
