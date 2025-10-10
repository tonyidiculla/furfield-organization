-- Check current policies on organization-certificates bucket
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
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%certificate%'
ORDER BY policyname;

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can upload certificates" ON storage.objects;
DROP POLICY IF EXISTS "Users can view certificates" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete certificates" ON storage.objects;

-- Create permissive INSERT policy for organization-certificates bucket
CREATE POLICY "Allow authenticated uploads to organization-certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'organization-certificates'
);

-- Create permissive SELECT policy for organization-certificates bucket
CREATE POLICY "Allow authenticated reads from organization-certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'organization-certificates'
);

-- Create permissive UPDATE policy for organization-certificates bucket
CREATE POLICY "Allow authenticated updates to organization-certificates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'organization-certificates'
)
WITH CHECK (
    bucket_id = 'organization-certificates'
);

-- Create permissive DELETE policy for organization-certificates bucket
CREATE POLICY "Allow authenticated deletes from organization-certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'organization-certificates'
);

-- Verify the policies were created
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%organization-certificates%'
ORDER BY policyname;
