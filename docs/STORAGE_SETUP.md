# Creating the Avatars Storage Bucket

## Steps to create the bucket in Supabase:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/xnetjsifkhtbbpadwlxy/storage/buckets

2. Click **"New bucket"**

3. Configure the bucket:

   - **Name**: `avatars`
   - **Public bucket**: ✅ Yes (enable this so avatar URLs work)
   - **File size limit**: 2 MB (recommended for avatars)
   - **Allowed MIME types**: image/jpeg, image/jpg, image/png, image/webp

4. Click **"Create bucket"**

5. (Optional) Set up RLS policies for the bucket:

   - Go to the bucket policies
   - Add a policy to allow authenticated users to upload:

     ```sql
     -- Allow authenticated users to upload their own avatars
     CREATE POLICY "Users can upload their own avatar"
     ON storage.objects FOR INSERT
     TO authenticated
     WITH CHECK (
       bucket_id = 'avatars' AND
       (storage.foldername(name))[1] = auth.uid()::text
     );

     -- Allow authenticated users to update their own avatars
     CREATE POLICY "Users can update their own avatar"
     ON storage.objects FOR UPDATE
     TO authenticated
     USING (
       bucket_id = 'avatars' AND
       (storage.foldername(name))[1] = auth.uid()::text
     );

     -- Allow public read access to all avatars
     CREATE POLICY "Anyone can view avatars"
     ON storage.objects FOR SELECT
     TO public
     USING (bucket_id = 'avatars');
     ```

## Alternative: Create via SQL

Run this in your Supabase SQL Editor:

```sql
-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

After creating the bucket, avatar uploads will work! 🎉
