-- Check and Insert HMS Modules
-- Run this in Supabase SQL Editor

-- Step 1: Check current modules
SELECT 
    id,
    module_name,
    module_display_name,
    solution_type,
    is_active,
    base_price
FROM master_data.modules
ORDER BY solution_type, module_display_name;

-- Step 2: Count HMS modules matching your query
SELECT COUNT(*) as hms_active_count
FROM master_data.modules
WHERE is_active = true 
AND solution_type ILIKE '%hms%';

-- Step 3: If count is 0, insert sample HMS modules
-- Uncomment and run this INSERT if you need test data:

/*
INSERT INTO master_data.modules (
    module_name,
    module_display_name,
    module_description,
    solution_type,
    is_active,
    base_price,
    payment_frequency
) VALUES 
    ('OPD', 'Out-Patient Department', 'Manage outpatient visits, appointments, and consultations', 'HMS', true, 1000, 'monthly'),
    ('IPD', 'In-Patient Department', 'Manage inpatient admissions, bed allocation, and ward management', 'HMS', true, 1500, 'monthly'),
    ('PHARMACY', 'Pharmacy Management', 'Inventory management, dispensing, and drug interactions', 'HMS', true, 800, 'monthly'),
    ('LABORATORY', 'Laboratory Information System', 'Lab test orders, results management, and reporting', 'HMS', true, 1200, 'monthly'),
    ('RADIOLOGY', 'Radiology & Imaging', 'PACS integration, imaging orders, and results', 'HMS', true, 1500, 'monthly'),
    ('BILLING', 'Billing & Revenue Cycle', 'Patient billing, insurance claims, and payment processing', 'HMS', true, 1000, 'monthly'),
    ('EMR', 'Electronic Medical Records', 'Complete patient health records and clinical documentation', 'HMS', true, 2000, 'monthly'),
    ('OT', 'Operation Theater Management', 'OT scheduling, equipment tracking, and surgical documentation', 'HMS', true, 1800, 'monthly'),
    ('ICU', 'ICU Management', 'Critical care monitoring, ventilator management, and protocols', 'HMS', true, 2000, 'monthly'),
    ('BLOOD_BANK', 'Blood Bank', 'Donor management, blood inventory, and transfusion tracking', 'HMS', true, 1000, 'monthly'),
    ('AMBULANCE', 'Ambulance & Emergency', 'Ambulance tracking, emergency response, and patient transfers', 'HMS', true, 800, 'monthly'),
    ('INVENTORY', 'General Inventory', 'Medical supplies, consumables, and asset management', 'HMS', true, 900, 'monthly'),
    ('HR', 'Human Resources', 'Staff management, attendance, payroll, and scheduling', 'HMS', true, 700, 'monthly'),
    ('REPORTS', 'Reports & Analytics', 'Business intelligence, dashboards, and regulatory reports', 'HMS', true, 1200, 'monthly'),
    ('QUEUE', 'Queue Management', 'Patient queue, token system, and waiting time optimization', 'HMS', true, 500, 'monthly')
ON CONFLICT (module_name) DO NOTHING;
*/

-- Step 4: Verify insertion
SELECT 
    COUNT(*) as total_hms_modules,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_hms_modules,
    AVG(base_price) as average_price
FROM master_data.modules
WHERE solution_type ILIKE '%hms%';

-- Step 5: Show what the frontend will fetch
SELECT 
    id, 
    module_name, 
    module_display_name, 
    module_description, 
    base_price, 
    payment_frequency, 
    solution_type, 
    is_active
FROM master_data.modules
WHERE solution_type ILIKE '%hms%'
AND is_active = true
ORDER BY module_display_name ASC;
