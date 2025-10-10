-- Create storage buckets for organization assets
-- These buckets store logos and certificates for organizations

-- Create organization-logos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'organization-logos',
    'organization-logos',
    true,  -- Public bucket so logos can be viewed
    2097152,  -- 2MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create organization-certificates bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'organization-certificates',
    'organization-certificates',
    false,  -- Private bucket, certificates are sensitive
    5242880,  -- 5MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for organization-logos bucket

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload organization logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'organization-logos'
);

-- Allow authenticated users to update their organization logos
CREATE POLICY "Authenticated users can update organization logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'organization-logos');

-- Allow authenticated users to delete their organization logos
CREATE POLICY "Authenticated users can delete organization logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'organization-logos');

-- Allow public access to view organization logos
CREATE POLICY "Public can view organization logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'organization-logos');

-- RLS Policies for organization-certificates bucket

-- Allow authenticated users to upload certificates
CREATE POLICY "Authenticated users can upload organization certificates"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'organization-certificates'
);

-- Allow authenticated users to update certificates
CREATE POLICY "Authenticated users can update organization certificates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'organization-certificates');

-- Allow authenticated users to delete certificates
CREATE POLICY "Authenticated users can delete organization certificates"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'organization-certificates');

-- Allow authenticated users to view certificates (private)
CREATE POLICY "Authenticated users can view organization certificates"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'organization-certificates');

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'objects'
AND policyname LIKE '%organization%'
ORDER BY policyname;
