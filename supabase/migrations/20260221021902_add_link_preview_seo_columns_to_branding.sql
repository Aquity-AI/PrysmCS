/*
  # Add Link Preview & SEO columns to platform_branding

  1. Modified Tables
    - `platform_branding`
      - `site_title` (text, default 'PrysmCS') - Browser tab title and og:title
      - `favicon_url` (text, nullable) - URL to custom favicon image
      - `og_image_url` (text, nullable) - URL to share thumbnail / OG image

  2. Important Notes
    - These columns enable full whitelabel control over link previews and SEO metadata
    - site_title defaults to 'PrysmCS' matching the existing platform_name default
    - favicon_url and og_image_url are nullable so the app can fall back to built-in defaults
    - No RLS changes needed; existing policies on platform_branding already cover these columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'platform_branding' AND column_name = 'site_title'
  ) THEN
    ALTER TABLE platform_branding ADD COLUMN site_title text NOT NULL DEFAULT 'PrysmCS';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'platform_branding' AND column_name = 'favicon_url'
  ) THEN
    ALTER TABLE platform_branding ADD COLUMN favicon_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'platform_branding' AND column_name = 'og_image_url'
  ) THEN
    ALTER TABLE platform_branding ADD COLUMN og_image_url text;
  END IF;
END $$;