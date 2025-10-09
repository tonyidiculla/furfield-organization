-- Check and fix RLS policies for location_currency table
-- This ensures the CountrySelector can read the data

-- First, check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'master_data' 
  AND tablename = 'location_currency';

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'master_data' 
  AND tablename = 'location_currency';

-- Drop existing policies if they're too restrictive
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON master_data.location_currency;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON master_data.location_currency;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON master_data.location_currency;

-- Enable RLS on the table
ALTER TABLE master_data.location_currency ENABLE ROW LEVEL SECURITY;

-- Create policy: Allow ALL authenticated users to READ location_currency data
-- This is reference data that everyone needs to see
CREATE POLICY "Allow authenticated users to read location_currency"
ON master_data.location_currency
FOR SELECT
TO authenticated
USING (true);

-- Create policy: Allow service role to do everything
CREATE POLICY "Allow service role full access to location_currency"
ON master_data.location_currency
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify the policies were created
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'master_data' 
  AND tablename = 'location_currency';

-- Test the query that useCountries hook uses
SELECT country_code, country_name
FROM master_data.location_currency
WHERE country_code IS NOT NULL 
  AND country_name IS NOT NULL
ORDER BY country_name;
