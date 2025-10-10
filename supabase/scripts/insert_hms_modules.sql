-- Insert HMS Modules into master_data.modules
-- Run this in Supabase SQL Editor to populate the modules table

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

-- Verify insertion
SELECT 
    COUNT(*) as total_inserted,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_modules
FROM master_data.modules
WHERE solution_type = 'HMS';

-- Show all HMS modules
SELECT 
    id, 
    module_name, 
    module_display_name, 
    base_price, 
    payment_frequency, 
    is_active
FROM master_data.modules
WHERE solution_type = 'HMS'
ORDER BY module_display_name ASC;
