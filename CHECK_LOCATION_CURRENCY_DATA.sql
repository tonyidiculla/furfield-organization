-- Check what countries are available in location_currency table
SELECT DISTINCT
    country_code,
    country_name
FROM master_data.location_currency
WHERE country_code IS NOT NULL
  AND country_name IS NOT NULL
ORDER BY country_name
LIMIT 20;

-- Check the full structure
SELECT 
    currency_code,
    currency_name,
    currency_symbol,
    country_code,
    country_name,
    is_active
FROM master_data.location_currency
LIMIT 10;
