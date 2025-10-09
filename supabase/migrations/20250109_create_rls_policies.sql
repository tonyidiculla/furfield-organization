-- Create RLS policies for master_data tables
-- This migration creates row-level security policies to allow users to access their own data

-- ====================
-- PROFILES TABLE POLICIES
-- ====================

-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile"
ON master_data.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON master_data.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to insert their own profile (for new signups)
CREATE POLICY "Users can insert their own profile"
ON master_data.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);


-- ====================
-- PLATFORM_ROLES TABLE POLICIES
-- ====================

-- Allow all authenticated users to read roles (needed to determine permissions)
CREATE POLICY "Authenticated users can view all roles"
ON master_data.platform_roles
FOR SELECT
TO authenticated
USING (true);


-- ====================
-- USER_TO_ROLE_ASSIGNMENT TABLE POLICIES
-- ====================

-- Allow users to view their own role assignments
CREATE POLICY "Users can view their own role assignments"
ON master_data.user_to_role_assignment
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM master_data.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.user_platform_id = user_to_role_assignment.user_platform_id
    )
);

-- Only platform admins can insert role assignments (checked via function)
CREATE POLICY "Platform admins can insert role assignments"
ON master_data.user_to_role_assignment
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM master_data.profiles p
        JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
        JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
        WHERE p.user_id = auth.uid()
        AND pr.privilege_level = 'platform_admin'
        AND ura.is_active = true
    )
);

-- Only platform admins can update role assignments
CREATE POLICY "Platform admins can update role assignments"
ON master_data.user_to_role_assignment
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM master_data.profiles p
        JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
        JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
        WHERE p.user_id = auth.uid()
        AND pr.privilege_level = 'platform_admin'
        AND ura.is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM master_data.profiles p
        JOIN master_data.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
        JOIN master_data.platform_roles pr ON ura.platform_role_id = pr.id
        WHERE p.user_id = auth.uid()
        AND pr.privilege_level = 'platform_admin'
        AND ura.is_active = true
    )
);


-- ====================
-- ORGANIZATIONS TABLE POLICIES
-- ====================

-- Allow users to view organizations they own
CREATE POLICY "Users can view their own organizations"
ON master_data.organizations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM master_data.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.user_platform_id = organizations.owner_platform_id
    )
);

-- Allow users to insert organizations (they become the owner)
CREATE POLICY "Users can create organizations"
ON master_data.organizations
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM master_data.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.user_platform_id = owner_platform_id
    )
);

-- Allow users to update their own organizations
CREATE POLICY "Users can update their own organizations"
ON master_data.organizations
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM master_data.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.user_platform_id = organizations.owner_platform_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM master_data.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.user_platform_id = organizations.owner_platform_id
    )
);

-- Allow users to delete their own organizations
CREATE POLICY "Users can delete their own organizations"
ON master_data.organizations
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM master_data.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.user_platform_id = organizations.owner_platform_id
    )
);


-- ====================
-- STORAGE POLICIES (profile-icons bucket)
-- ====================

-- These should already exist from previous migration, but ensuring they're correct

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload profile icons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their profile icons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their profile icons" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile icons" ON storage.objects;

-- Allow authenticated users to upload to their own folder in profile-icons
CREATE POLICY "Authenticated users can upload profile icons"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile-icons'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update their profile icons"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profile-icons'
    AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
    bucket_id = 'profile-icons'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete their profile icons"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'profile-icons'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public to view profile icons
CREATE POLICY "Public can view profile icons"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-icons');
