-- Function to generate organization platform ID with random alphanumeric characters
-- Format: C00 + 6 random characters (A-Z, a-z, 0-9)
-- Example: C00aB3xY9

CREATE OR REPLACE FUNCTION master_data.generate_organization_platform_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_platform_id TEXT;
    v_random_chars TEXT;
    v_chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    v_attempt INTEGER := 0;
    v_max_attempts INTEGER := 100;
BEGIN
    LOOP
        v_attempt := v_attempt + 1;
        
        -- Exit if we've tried too many times
        IF v_attempt > v_max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique organization platform ID after % attempts', v_max_attempts;
        END IF;
        
        -- Generate 6 random alphanumeric characters
        v_random_chars := '';
        FOR i IN 1..6 LOOP
            v_random_chars := v_random_chars || 
                substring(v_chars FROM (floor(random() * length(v_chars) + 1))::int FOR 1);
        END LOOP;
        
        -- Build platform ID: C00 + 6 random characters
        v_platform_id := 'C00' || v_random_chars;
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM master_data.organizations WHERE organization_platform_id = v_platform_id) THEN
            -- Found a unique ID, return it
            RETURN v_platform_id;
        END IF;
        
        -- If ID exists, loop will try again
    END LOOP;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION master_data.generate_organization_platform_id() TO authenticated;

-- Add comment
COMMENT ON FUNCTION master_data.generate_organization_platform_id IS 
'Generates a unique organization platform ID in format: C00 + 6 random alphanumeric characters
- Format: C00[A-Za-z0-9]{6}
- Example: C00aB3xY9, C00Xyz123
- Ensures uniqueness by checking existing IDs';
