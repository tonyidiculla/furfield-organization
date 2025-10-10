-- Check if business_type column exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'master_data'
  AND table_name = 'organizations'
  AND column_name = 'business_type';

-- Check current business_type values
SELECT 
    organization_id,
    organization_name,
    business_type,
    updated_at
FROM master_data.organizations
ORDER BY updated_at DESC
LIMIT 5;

-- Test updating business_type directly (uncomment to run)
-- UPDATE master_data.organizations
-- SET business_type = 'LLC',
--     updated_at = now()
-- WHERE organization_id = '639e9d01-756f-4776-80ed-075e5cedefb6';  -- Replace with your org ID

-- Verify the update
-- SELECT 
--     organization_id,
--     organization_name,
--     business_type,
--     updated_at
-- FROM master_data.organizations
-- WHERE organization_id = '639e9d01-756f-4776-80ed-075e5cedefb6';
