-- Check ALL owner fields in the database
SELECT 
    organization_id,
    organization_name,
    owner_platform_id,
    owner_first_name,
    owner_last_name,
    owner_email,
    owner_user_id
FROM master_data.organizations
WHERE organization_id = '639e9d01-756f-4776-80ed-075e5cedefb6';
