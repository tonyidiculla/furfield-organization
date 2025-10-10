-- Try to run the exact same update that's failing
-- First, let's see what's currently in the database
SELECT 
    entity_platform_id,
    entity_name,
    currency,
    language,
    address,
    city,
    state,
    post_code,
    country,
    is_active,
    hospital_type
FROM master_data.hospitals 
WHERE entity_platform_id = 'E00000001';

-- Now try the update
UPDATE master_data.hospitals
SET 
    entity_name = 'FURFIELD',
    currency = 'INR',
    language = 'ENGLISH',
    address = NULL,
    city = NULL,
    state = NULL,
    post_code = NULL,
    country = 'IN',
    is_active = true
WHERE entity_platform_id = 'E00000001';

-- Check result
SELECT 
    entity_platform_id,
    entity_name,
    currency,
    language,
    address,
    city,
    state,
    post_code,
    country,
    is_active,
    hospital_type
FROM master_data.hospitals 
WHERE entity_platform_id = 'E00000001';
