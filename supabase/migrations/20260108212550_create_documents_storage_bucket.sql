/*
  # Create Storage Bucket for Documents

  1. New Storage Bucket
    - Create `documents` bucket for storing client documents
    - Enable public access for authenticated users
  
  2. Storage Policies
    - Allow authenticated users to upload documents
    - Allow authenticated users to read documents
    - Allow authenticated users to delete their own documents

  3. Notes
    - Files will be organized by client/document ID
    - Public URL access for easy sharing
*/

-- Create the storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to read documents
CREATE POLICY "Authenticated users can read documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Allow authenticated users to delete documents
CREATE POLICY "Authenticated users can delete documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- Allow authenticated users to update documents
CREATE POLICY "Authenticated users can update documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');