-- Check if organizations actually exist in the database

-- Check total count (bypassing any filters)
SELECT 
    'Total Organizations in Database' as info,
    COUNT(*) as total_count
FROM master_data.organizations;

-- Check your specific organization
SELECT 
    'Your Organization Details' as info,
    organization_id,
    organization_name,
    brand_name,
    organization_platform_id,
    is_active,
    created_at
FROM master_data.organizations
WHERE organization_id = '639e9d01-756f-4776-80ed-075e5cedefb6'
OR organization_name ILIKE '%fusionduo%';

-- Check all organizations (see what's there)
SELECT 
    'All Organizations' as info,
    organization_id,
    organization_name,
    organization_platform_id,
    is_active
FROM master_data.organizations
LIMIT 10;

-- Check if the issue is with the query in your app
-- What does the app query look like?
SELECT 
    'Test App Query' as info,
    organization_id,
    organization_name,
    logo_storage,
    is_active
FROM master_data.organizations
WHERE is_active = 'active';
