-- Check bucket configuration
SELECT 
    id,
    name,
    owner,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
WHERE name = 'organization-certificates';

-- If bucket needs to be made public, uncomment:
-- UPDATE storage.buckets
-- SET public = true
-- WHERE name = 'organization-certificates';

-- Alternative: Create simple permissive policies if the above don't work
-- This allows any authenticated user to upload to organization-certificates

-- First, remove all existing policies for this bucket
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
          AND schemaname = 'storage'
          AND (
            policyname LIKE '%certificate%' 
            OR qual LIKE '%organization-certificates%'
            OR with_check LIKE '%organization-certificates%'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Create new permissive policies
CREATE POLICY "organization_certificates_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'organization-certificates');

CREATE POLICY "organization_certificates_select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'organization-certificates');

CREATE POLICY "organization_certificates_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'organization-certificates')
WITH CHECK (bucket_id = 'organization-certificates');

CREATE POLICY "organization_certificates_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'organization-certificates');
