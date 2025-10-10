-- Check the actual data for this specific hospital
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
    hospital_type,
    facility_type,
    entity_type
FROM master_data.hospitals 
WHERE entity_platform_id = 'E00000001';

-- Check if any text columns contain "clinical_staff"
SELECT 
    entity_platform_id,
    entity_name,
    hospital_type,
    facility_type,
    entity_type,
    specializations,
    accreditation_body
FROM master_data.hospitals 
WHERE entity_platform_id = 'E00000001';
