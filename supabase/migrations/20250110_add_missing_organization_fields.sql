-- Add missing fields to organizations table

-- Add manager_phone
ALTER TABLE master_data.organizations
ADD COLUMN IF NOT EXISTS manager_phone text;

-- Add business_type
ALTER TABLE master_data.organizations
ADD COLUMN IF NOT EXISTS business_type text;

-- Add theme_preference
ALTER TABLE master_data.organizations
ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'light';

-- Add comments for documentation
COMMENT ON COLUMN master_data.organizations.manager_phone IS 'Contact phone number for the organization manager';
COMMENT ON COLUMN master_data.organizations.business_type IS 'Type of business entity (e.g., LLC, Corporation, Partnership, LLP, etc.)';
COMMENT ON COLUMN master_data.organizations.theme_preference IS 'UI theme preference: light, dark, or auto';
