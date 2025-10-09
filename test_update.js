const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUpdate() {
    const organizationId = '639e9d01-756f-4776-80ed-075e5cedefb6'
    
    console.log('Testing update with new fields...\n')
    
    // Test 1: Update with existing fields only
    console.log('Test 1: Update existing fields')
    const { data: test1, error: error1 } = await supabase
        .schema('master_data')
        .from('organizations')
        .update({
            organization_name: 'Test Update',
            updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .select()
    
    if (error1) {
        console.error('❌ Test 1 failed:', error1.message, error1.details, error1.hint)
    } else {
        console.log('✅ Test 1 passed')
    }
    
    // Test 2: Update with manager_phone
    console.log('\nTest 2: Update manager_phone')
    const { data: test2, error: error2 } = await supabase
        .schema('master_data')
        .from('organizations')
        .update({
            manager_phone: '+1-555-0123',
            updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .select()
    
    if (error2) {
        console.error('❌ Test 2 failed:', error2.message)
        console.error('Details:', error2.details)
        console.error('Hint:', error2.hint)
        console.error('Code:', error2.code)
    } else {
        console.log('✅ Test 2 passed')
    }
    
    // Test 3: Update with business_type
    console.log('\nTest 3: Update business_type')
    const { data: test3, error: error3 } = await supabase
        .schema('master_data')
        .from('organizations')
        .update({
            business_type: 'LLC',
            updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .select()
    
    if (error3) {
        console.error('❌ Test 3 failed:', error3.message)
        console.error('Details:', error3.details)
    } else {
        console.log('✅ Test 3 passed')
    }
    
    // Test 4: Update with theme_preference
    console.log('\nTest 4: Update theme_preference')
    const { data: test4, error: error4 } = await supabase
        .schema('master_data')
        .from('organizations')
        .update({
            theme_preference: 'light',
            updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .select()
    
    if (error4) {
        console.error('❌ Test 4 failed:', error4.message)
        console.error('Details:', error4.details)
    } else {
        console.log('✅ Test 4 passed')
    }
    
    console.log('\n=== Summary ===')
    console.log('Missing columns need to be added via migration SQL in Supabase dashboard')
    
    process.exit(0)
}

testUpdate().catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
})
