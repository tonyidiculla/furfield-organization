-- Query to extract location_currency data
-- Run this in Supabase SQL Editor and share the results

-- First, check the table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'master_data' 
  AND table_name = 'location_currency'
ORDER BY ordinal_position;

-- Check total records
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT country_code) as unique_countries,
    COUNT(DISTINCT currency_code) as unique_currencies,
    COUNT(*) FILTER (WHERE is_active = true) as active_records,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_records
FROM master_data.location_currency;

-- Show sample data (first 20 rows)
SELECT 
    country_code,
    country_name,
    currency_code,
    currency_name,
    is_active
FROM master_data.location_currency
ORDER BY country_name
LIMIT 20;

-- Check for NULL values that might cause issues
SELECT 
    COUNT(*) FILTER (WHERE country_code IS NULL) as null_country_codes,
    COUNT(*) FILTER (WHERE country_name IS NULL) as null_country_names,
    COUNT(*) FILTER (WHERE currency_code IS NULL) as null_currency_codes,
    COUNT(*) FILTER (WHERE currency_name IS NULL) as null_currency_names
FROM master_data.location_currency;

-- Show all distinct countries (this is what the CountrySelector should display)
SELECT 
    DISTINCT country_code,
    country_name
FROM master_data.location_currency
WHERE country_code IS NOT NULL 
  AND country_name IS NOT NULL
ORDER BY country_name;
