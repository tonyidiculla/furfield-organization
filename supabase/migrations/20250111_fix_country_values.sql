-- Fix country values in hospitals table
-- The country column should store country codes (e.g., 'IN') not country names (e.g., 'India')

-- First, check what values exist
SELECT DISTINCT country FROM master_data.hospitals WHERE country IS NOT NULL;

-- Update common country names to country codes
UPDATE master_data.hospitals
SET country = CASE 
    WHEN country = 'India' THEN 'IN'
    WHEN country = 'United States' THEN 'US'
    WHEN country = 'United Kingdom' THEN 'GB'
    WHEN country = 'Canada' THEN 'CA'
    WHEN country = 'Australia' THEN 'AU'
    WHEN country = 'Germany' THEN 'DE'
    WHEN country = 'France' THEN 'FR'
    WHEN country = 'Japan' THEN 'JP'
    WHEN country = 'China' THEN 'CN'
    WHEN country = 'Brazil' THEN 'BR'
    WHEN country = 'Mexico' THEN 'MX'
    WHEN country = 'Singapore' THEN 'SG'
    WHEN country = 'Malaysia' THEN 'MY'
    WHEN country = 'Thailand' THEN 'TH'
    WHEN country = 'Indonesia' THEN 'ID'
    WHEN country = 'Philippines' THEN 'PH'
    WHEN country = 'Vietnam' THEN 'VN'
    WHEN country = 'South Korea' THEN 'KR'
    WHEN country = 'Hong Kong' THEN 'HK'
    WHEN country = 'Taiwan' THEN 'TW'
    WHEN country = 'Pakistan' THEN 'PK'
    WHEN country = 'Bangladesh' THEN 'BD'
    WHEN country = 'Sri Lanka' THEN 'LK'
    WHEN country = 'Nepal' THEN 'NP'
    WHEN country = 'Spain' THEN 'ES'
    WHEN country = 'Italy' THEN 'IT'
    WHEN country = 'Netherlands' THEN 'NL'
    WHEN country = 'Belgium' THEN 'BE'
    WHEN country = 'Switzerland' THEN 'CH'
    WHEN country = 'Austria' THEN 'AT'
    WHEN country = 'Sweden' THEN 'SE'
    WHEN country = 'Norway' THEN 'NO'
    WHEN country = 'Denmark' THEN 'DK'
    WHEN country = 'Poland' THEN 'PL'
    WHEN country = 'Russia' THEN 'RU'
    WHEN country = 'Turkey' THEN 'TR'
    WHEN country = 'UAE' OR country = 'United Arab Emirates' THEN 'AE'
    WHEN country = 'Saudi Arabia' THEN 'SA'
    WHEN country = 'South Africa' THEN 'ZA'
    WHEN country = 'Egypt' THEN 'EG'
    WHEN country = 'Nigeria' THEN 'NG'
    WHEN country = 'Kenya' THEN 'KE'
    WHEN country = 'Argentina' THEN 'AR'
    WHEN country = 'Chile' THEN 'CL'
    WHEN country = 'Colombia' THEN 'CO'
    WHEN country = 'Peru' THEN 'PE'
    WHEN country = 'New Zealand' THEN 'NZ'
    ELSE country -- Keep as is if already a code or unknown
END
WHERE country IS NOT NULL
AND LENGTH(country) > 2; -- Only update if it's not already a 2-letter code

-- Verify the updates
SELECT 
    country, 
    currency,
    COUNT(*) as count
FROM master_data.hospitals 
WHERE country IS NOT NULL
GROUP BY country, currency
ORDER BY country;
