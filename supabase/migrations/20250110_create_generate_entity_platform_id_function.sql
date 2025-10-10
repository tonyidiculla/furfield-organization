-- Function to generate entity platform ID with random alphanumeric characters
-- Format: E01 + 6 random alphanumeric characters (uppercase and lowercase letters, digits)
-- Example: E01x3Bm9k

CREATE OR REPLACE FUNCTION master_data.generate_entity_platform_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_platform_id TEXT;
    v_exists BOOLEAN;
    v_attempts INTEGER := 0;
    v_max_attempts INTEGER := 100;
BEGIN
    LOOP
        -- Generate random 6-character alphanumeric string (uppercase, lowercase, digits)
        v_platform_id := 'E01' || 
            array_to_string(ARRAY(
                SELECT substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 
                    floor(random() * 62 + 1)::int, 1)
                FROM generate_series(1, 6)
            ), '');
        
        -- Check if ID already exists
        SELECT EXISTS(
            SELECT 1 FROM master_data.hospitals WHERE entity_platform_id = v_platform_id
        ) INTO v_exists;
        
        -- If unique, return it
        IF NOT v_exists THEN
            RETURN v_platform_id;
        END IF;
        
        -- Increment attempts
        v_attempts := v_attempts + 1;
        IF v_attempts >= v_max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique entity platform ID after % attempts', v_max_attempts;
        END IF;
    END LOOP;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION master_data.generate_entity_platform_id() TO authenticated;

-- Add comment
COMMENT ON FUNCTION master_data.generate_entity_platform_id IS 
'Generates a unique entity platform ID in format: E01 + 6 random alphanumeric characters
Example: E01x3Bm9k
Checks hospitals table for uniqueness.';
