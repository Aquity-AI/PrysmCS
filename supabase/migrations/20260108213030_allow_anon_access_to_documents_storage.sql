/*
  # Allow Anonymous Access to Documents Storage

  1. Updates
    - Drop existing policies that require authentication
    - Create new policies allowing anonymous (public) access
    - Enable insert, select, update, and delete for anon role

  2. Security Notes
    - This allows public access to the storage bucket
    - Suitable for demo/testing environments
    - In production, implement proper authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;

-- Allow anon users to upload files
CREATE POLICY "Anyone can upload documents"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'documents');

-- Allow anon users to read documents
CREATE POLICY "Anyone can read documents"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'documents');

-- Allow anon users to delete documents
CREATE POLICY "Anyone can delete documents"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'documents');

-- Allow anon users to update documents
CREATE POLICY "Anyone can update documents"
ON storage.objects
FOR UPDATE
TO anon
USING (bucket_id = 'documents');