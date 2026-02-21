/*
  # Create Storage Bucket for Brand Assets

  1. New Storage Bucket
    - Create `brand-assets` bucket for storing favicon and OG images
    - Public access enabled so images can be referenced by URL in meta tags

  2. Storage Policies
    - Allow anon users to upload, read, update, and delete brand assets
    - Matches the existing access pattern used by the documents bucket

  3. Important Notes
    - Files are organized with deterministic names (e.g., favicon.png, og-image.png)
    - Public URLs are used directly in HTML meta tags and link elements
    - File size should be kept small (favicons ~64KB, OG images ~500KB)
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'image/webp', 'image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload brand assets"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'brand-assets');

CREATE POLICY "Anyone can read brand assets"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'brand-assets');

CREATE POLICY "Anyone can update brand assets"
ON storage.objects
FOR UPDATE
TO anon
USING (bucket_id = 'brand-assets');

CREATE POLICY "Anyone can delete brand assets"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'brand-assets');