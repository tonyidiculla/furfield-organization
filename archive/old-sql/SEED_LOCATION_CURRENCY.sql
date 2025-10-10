-- Seed data for location_currency table
-- This provides country to currency mappings for the CountrySelector

INSERT INTO master_data.location_currency (
    country_code, 
    country_name, 
    currency_code, 
    currency_name, 
    is_active, 
    created_at, 
    updated_at
) VALUES
-- North America
('US', 'United States', 'USD', 'US Dollar', true, NOW(), NOW()),
('CA', 'Canada', 'CAD', 'Canadian Dollar', true, NOW(), NOW()),
('MX', 'Mexico', 'MXN', 'Mexican Peso', true, NOW(), NOW()),

-- Europe
('GB', 'United Kingdom', 'GBP', 'British Pound', true, NOW(), NOW()),
('DE', 'Germany', 'EUR', 'Euro', true, NOW(), NOW()),
('FR', 'France', 'EUR', 'Euro', true, NOW(), NOW()),
('IT', 'Italy', 'EUR', 'Euro', true, NOW(), NOW()),
('ES', 'Spain', 'EUR', 'Euro', true, NOW(), NOW()),
('NL', 'Netherlands', 'EUR', 'Euro', true, NOW(), NOW()),
('BE', 'Belgium', 'EUR', 'Euro', true, NOW(), NOW()),
('AT', 'Austria', 'EUR', 'Euro', true, NOW(), NOW()),
('PT', 'Portugal', 'EUR', 'Euro', true, NOW(), NOW()),
('IE', 'Ireland', 'EUR', 'Euro', true, NOW(), NOW()),
('CH', 'Switzerland', 'CHF', 'Swiss Franc', true, NOW(), NOW()),
('NO', 'Norway', 'NOK', 'Norwegian Krone', true, NOW(), NOW()),
('SE', 'Sweden', 'SEK', 'Swedish Krona', true, NOW(), NOW()),
('DK', 'Denmark', 'DKK', 'Danish Krone', true, NOW(), NOW()),
('PL', 'Poland', 'PLN', 'Polish Zloty', true, NOW(), NOW()),
('CZ', 'Czech Republic', 'CZK', 'Czech Koruna', true, NOW(), NOW()),

-- Asia
('IN', 'India', 'INR', 'Indian Rupee', true, NOW(), NOW()),
('CN', 'China', 'CNY', 'Chinese Yuan', true, NOW(), NOW()),
('JP', 'Japan', 'JPY', 'Japanese Yen', true, NOW(), NOW()),
('KR', 'South Korea', 'KRW', 'South Korean Won', true, NOW(), NOW()),
('SG', 'Singapore', 'SGD', 'Singapore Dollar', true, NOW(), NOW()),
('MY', 'Malaysia', 'MYR', 'Malaysian Ringgit', true, NOW(), NOW()),
('TH', 'Thailand', 'THB', 'Thai Baht', true, NOW(), NOW()),
('ID', 'Indonesia', 'IDR', 'Indonesian Rupiah', true, NOW(), NOW()),
('PH', 'Philippines', 'PHP', 'Philippine Peso', true, NOW(), NOW()),
('VN', 'Vietnam', 'VND', 'Vietnamese Dong', true, NOW(), NOW()),
('HK', 'Hong Kong', 'HKD', 'Hong Kong Dollar', true, NOW(), NOW()),
('TW', 'Taiwan', 'TWD', 'Taiwan Dollar', true, NOW(), NOW()),
('PK', 'Pakistan', 'PKR', 'Pakistani Rupee', true, NOW(), NOW()),
('BD', 'Bangladesh', 'BDT', 'Bangladeshi Taka', true, NOW(), NOW()),
('LK', 'Sri Lanka', 'LKR', 'Sri Lankan Rupee', true, NOW(), NOW()),

-- Middle East
('AE', 'United Arab Emirates', 'AED', 'UAE Dirham', true, NOW(), NOW()),
('SA', 'Saudi Arabia', 'SAR', 'Saudi Riyal', true, NOW(), NOW()),
('IL', 'Israel', 'ILS', 'Israeli Shekel', true, NOW(), NOW()),
('TR', 'Turkey', 'TRY', 'Turkish Lira', true, NOW(), NOW()),
('QA', 'Qatar', 'QAR', 'Qatari Riyal', true, NOW(), NOW()),
('KW', 'Kuwait', 'KWD', 'Kuwaiti Dinar', true, NOW(), NOW()),
('BH', 'Bahrain', 'BHD', 'Bahraini Dinar', true, NOW(), NOW()),
('OM', 'Oman', 'OMR', 'Omani Rial', true, NOW(), NOW()),

-- Oceania
('AU', 'Australia', 'AUD', 'Australian Dollar', true, NOW(), NOW()),
('NZ', 'New Zealand', 'NZD', 'New Zealand Dollar', true, NOW(), NOW()),

-- Africa
('ZA', 'South Africa', 'ZAR', 'South African Rand', true, NOW(), NOW()),
('NG', 'Nigeria', 'NGN', 'Nigerian Naira', true, NOW(), NOW()),
('EG', 'Egypt', 'EGP', 'Egyptian Pound', true, NOW(), NOW()),
('KE', 'Kenya', 'KES', 'Kenyan Shilling', true, NOW(), NOW()),
('GH', 'Ghana', 'GHS', 'Ghanaian Cedi', true, NOW(), NOW()),
('MA', 'Morocco', 'MAD', 'Moroccan Dirham', true, NOW(), NOW()),

-- South America
('BR', 'Brazil', 'BRL', 'Brazilian Real', true, NOW(), NOW()),
('AR', 'Argentina', 'ARS', 'Argentine Peso', true, NOW(), NOW()),
('CL', 'Chile', 'CLP', 'Chilean Peso', true, NOW(), NOW()),
('CO', 'Colombia', 'COP', 'Colombian Peso', true, NOW(), NOW()),
('PE', 'Peru', 'PEN', 'Peruvian Sol', true, NOW(), NOW())

ON CONFLICT (country_code, currency_code) 
DO UPDATE SET
    country_name = EXCLUDED.country_name,
    currency_name = EXCLUDED.currency_name,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Verify the data was inserted
SELECT 
    COUNT(*) as total_rows,
    COUNT(DISTINCT country_code) as unique_countries,
    COUNT(DISTINCT currency_code) as unique_currencies
FROM master_data.location_currency
WHERE is_active = true;
