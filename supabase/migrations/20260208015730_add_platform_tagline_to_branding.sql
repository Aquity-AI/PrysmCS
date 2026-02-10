/*
  # Add platform_tagline to platform_branding table

  1. Modified Tables
    - `platform_branding`
      - Added `platform_tagline` (text) - Configurable tagline shown on reports and presentation headers
  
  2. Notes
    - Defaults to empty string
    - Used in PDF report header and presentation mode
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'platform_branding' AND column_name = 'platform_tagline'
  ) THEN
    ALTER TABLE platform_branding ADD COLUMN platform_tagline text DEFAULT '' NOT NULL;
  END IF;
END $$;
