-- RLS policies for profile-icons storage bucket

-- Allow authenticated users to upload their own profile icons
CREATE POLICY "Users can upload their own profile icon"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-icons' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own profile icons
CREATE POLICY "Users can update their own profile icon"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-icons' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own profile icons
CREATE POLICY "Users can delete their own profile icon"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-icons' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all profile icons
CREATE POLICY "Anyone can view profile icons"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-icons');
