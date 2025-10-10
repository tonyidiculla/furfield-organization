-- SIMPLE FIX: Add RLS policies for organization-certificates bucket
-- Run this in Supabase SQL Editor

-- Drop any existing conflicting policies first
DROP POLICY IF EXISTS "organization_certificates_insert" ON storage.objects;
DROP POLICY IF EXISTS "organization_certificates_select" ON storage.objects;
DROP POLICY IF EXISTS "organization_certificates_update" ON storage.objects;
DROP POLICY IF EXISTS "organization_certificates_delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to organization-certificates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from organization-certificates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to organization-certificates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from organization-certificates" ON storage.objects;

-- Create new permissive policies for authenticated users
CREATE POLICY "cert_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'organization-certificates');

CREATE POLICY "cert_select_policy"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'organization-certificates');

CREATE POLICY "cert_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'organization-certificates')
WITH CHECK (bucket_id = 'organization-certificates');

CREATE POLICY "cert_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'organization-certificates');

-- Verify policies were created
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN roles = '{authenticated}' THEN 'authenticated users'
        ELSE roles::text
    END as who_can_access
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE 'cert_%'
ORDER BY policyname;
