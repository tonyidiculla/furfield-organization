-- Add subscription-related columns to hospitals table
-- This allows storing selected modules and subscription information directly

ALTER TABLE master_data.hospitals
ADD COLUMN IF NOT EXISTS subscribed_modules JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended', 'trial', 'expired')),
ADD COLUMN IF NOT EXISTS monthly_subscription_cost NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS one_time_costs NUMERIC(10, 2) DEFAULT 0.00;

-- Add comments for documentation
COMMENT ON COLUMN master_data.hospitals.subscribed_modules IS 
'JSONB array of module IDs and their details. Format: [{"module_id": "uuid", "module_name": "text", "activated_at": "timestamp"}]';

COMMENT ON COLUMN master_data.hospitals.subscription_start_date IS 
'Date when the hospital subscription started';

COMMENT ON COLUMN master_data.hospitals.subscription_end_date IS 
'Date when the hospital subscription ends (null for ongoing subscriptions)';

COMMENT ON COLUMN master_data.hospitals.subscription_status IS 
'Current status of the hospital subscription: active, inactive, suspended, trial, or expired';

COMMENT ON COLUMN master_data.hospitals.monthly_subscription_cost IS 
'Total monthly cost for all subscribed modules';

COMMENT ON COLUMN master_data.hospitals.one_time_costs IS 
'Total one-time costs for all subscribed modules';

-- Create an index on subscription_status for faster queries
CREATE INDEX IF NOT EXISTS idx_hospitals_subscription_status ON master_data.hospitals(subscription_status);

-- Create a GIN index on subscribed_modules for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_hospitals_subscribed_modules ON master_data.hospitals USING GIN (subscribed_modules);
