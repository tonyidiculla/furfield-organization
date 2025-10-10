-- Check if entity_modules table exists in master_data schema
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'master_data'
        AND table_name = 'entity_modules'
    ) THEN
        RAISE NOTICE 'master_data.entity_modules table exists';
    ELSE
        RAISE NOTICE 'master_data.entity_modules table does NOT exist';
    END IF;
END $$;

-- Show the current structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'master_data'
AND table_name = 'entity_modules'
ORDER BY ordinal_position;

-- If the table doesn't exist or has wrong structure, create/fix it
-- DROP TABLE IF EXISTS master_data.entity_modules CASCADE;

CREATE TABLE IF NOT EXISTS master_data.entity_modules (
    id SERIAL PRIMARY KEY,
    entity_platform_id TEXT NOT NULL REFERENCES master_data.hospitals(entity_platform_id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL REFERENCES master_data.modules(id) ON DELETE CASCADE,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(entity_platform_id, module_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_entity_modules_entity_id ON master_data.entity_modules(entity_platform_id);
CREATE INDEX IF NOT EXISTS idx_entity_modules_module_id ON master_data.entity_modules(module_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON master_data.entity_modules TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE master_data.entity_modules_id_seq TO authenticated;

-- Verify the structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'master_data'
AND table_name = 'entity_modules'
ORDER BY ordinal_position;
