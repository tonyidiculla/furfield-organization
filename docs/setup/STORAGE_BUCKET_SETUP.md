# Storage Bucket Setup for Certificate of Incorporation

The certificate upload feature requires a Supabase Storage bucket named `organization-documents`.

## Create the Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `organization-documents`
4. Public: Yes (or No if you want private access)
5. File size limit: 5242880 (5MB)
6. Allowed MIME types:
   - application/pdf
   - image/jpeg
   - image/png
   - image/webp

## Storage Policies (RLS)

If the bucket is not public, add these policies:

### SELECT Policy (View):

```sql
CREATE POLICY "Users can view their organization documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'organization-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### INSERT Policy (Upload):

```sql
CREATE POLICY "Users can upload to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### DELETE Policy:

```sql
CREATE POLICY "Users can delete their documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## File Structure

Files are stored as: `{user_id}/documents/certificate_{timestamp}.{ext}`

## Alternative: Use Existing Bucket

If you prefer to use an existing bucket like `profile-icons`, change line in the code:

```typescript
// Change from:
.from('organization-documents')

// To:
.from('profile-icons')
```
