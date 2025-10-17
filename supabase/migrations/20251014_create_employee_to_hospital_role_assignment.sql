-- Create employee_to_hospital_role_assignment table
-- This table links employees (users) to specific hospitals with their roles
-- Part of the complete authentication flow:
-- auth.users -> master_data.profiles -> master_data.user_to_role_assignment -> master_data.employee_to_hospital_role_assignment

-- Create the table in master_data schema
CREATE TABLE IF NOT EXISTS master_data.employee_to_hospital_role_assignment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_platform_id TEXT NOT NULL,
    hospital_id TEXT NOT NULL,
    hospital_role_id UUID,
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by TEXT,
    expires_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key to profiles table
    CONSTRAINT fk_employee_platform_id 
        FOREIGN KEY (employee_platform_id) 
        REFERENCES master_data.profiles(user_platform_id)
        ON DELETE CASCADE,
    
    -- Foreign key to hospitals table
    CONSTRAINT fk_hospital_id 
        FOREIGN KEY (hospital_id) 
        REFERENCES master_data.hospitals(entity_platform_id)
        ON DELETE CASCADE,
    
    -- Unique constraint: one active assignment per employee per hospital
    CONSTRAINT unique_employee_hospital 
        UNIQUE (employee_platform_id, hospital_id, is_active)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_hospital_employee 
    ON master_data.employee_to_hospital_role_assignment(employee_platform_id);

CREATE INDEX IF NOT EXISTS idx_employee_hospital_hospital 
    ON master_data.employee_to_hospital_role_assignment(hospital_id);

CREATE INDEX IF NOT EXISTS idx_employee_hospital_active 
    ON master_data.employee_to_hospital_role_assignment(is_active) 
    WHERE is_active = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION master_data.update_employee_hospital_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employee_hospital_updated_at
    BEFORE UPDATE ON master_data.employee_to_hospital_role_assignment
    FOR EACH ROW
    EXECUTE FUNCTION master_data.update_employee_hospital_updated_at();

-- Enable Row Level Security
ALTER TABLE master_data.employee_to_hospital_role_assignment ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to view their own assignments
CREATE POLICY "employee_hospital_select_own" 
    ON master_data.employee_to_hospital_role_assignment
    FOR SELECT
    TO authenticated
    USING (
        employee_platform_id IN (
            SELECT user_platform_id 
            FROM master_data.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Platform admins can view all assignments
CREATE POLICY "employee_hospital_select_admin" 
    ON master_data.employee_to_hospital_role_assignment
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM master_data.profiles p
            JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
            JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
            WHERE p.user_id = auth.uid()
            AND ura.is_active = true
            AND pr.is_active = true
            AND pr.privilege_level IN ('platform_admin', 'organization_admin')
        )
    );

-- RLS Policy: Hospital admins can view assignments for their hospital
CREATE POLICY "employee_hospital_select_hospital_admin" 
    ON master_data.employee_to_hospital_role_assignment
    FOR SELECT
    TO authenticated
    USING (
        hospital_id IN (
            SELECT ehra.hospital_id
            FROM master_data.employee_to_hospital_role_assignment ehra
            JOIN master_data.profiles p ON ehra.employee_platform_id = p.user_platform_id
            JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
            JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
            WHERE p.user_id = auth.uid()
            AND ehra.is_active = true
            AND pr.privilege_level = 'hospital_admin'
        )
    );

-- RLS Policy: Platform and organization admins can insert assignments
CREATE POLICY "employee_hospital_insert_admin" 
    ON master_data.employee_to_hospital_role_assignment
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM master_data.profiles p
            JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
            JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
            WHERE p.user_id = auth.uid()
            AND ura.is_active = true
            AND pr.is_active = true
            AND pr.privilege_level IN ('platform_admin', 'organization_admin')
        )
    );

-- RLS Policy: Platform and organization admins can update assignments
CREATE POLICY "employee_hospital_update_admin" 
    ON master_data.employee_to_hospital_role_assignment
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM master_data.profiles p
            JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
            JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
            WHERE p.user_id = auth.uid()
            AND ura.is_active = true
            AND pr.is_active = true
            AND pr.privilege_level IN ('platform_admin', 'organization_admin')
        )
    );

-- RLS Policy: Only platform admins can delete assignments
CREATE POLICY "employee_hospital_delete_admin" 
    ON master_data.employee_to_hospital_role_assignment
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM master_data.profiles p
            JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
            JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
            WHERE p.user_id = auth.uid()
            AND ura.is_active = true
            AND pr.privilege_level = 'platform_admin'
        )
    );

-- Grant permissions
GRANT SELECT ON master_data.employee_to_hospital_role_assignment TO authenticated;
GRANT INSERT, UPDATE, DELETE ON master_data.employee_to_hospital_role_assignment TO authenticated;
GRANT SELECT ON master_data.employee_to_hospital_role_assignment TO anon;

-- Add helpful comment
COMMENT ON TABLE master_data.employee_to_hospital_role_assignment IS 
'Links employees to specific hospitals with their roles and assignments. Part of the complete authentication flow.';
