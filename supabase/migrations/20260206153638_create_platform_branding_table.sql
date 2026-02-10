/*
  # Create Global Platform Branding Table

  1. New Tables
    - `platform_branding`
      - `id` (uuid, primary key)
      - `platform_name` (text) - Display name of the platform
      - `logo_url` (text, nullable) - URL to custom logo image
      - `logo_text` (text) - Text to display when no logo image
      - `logo_mode` (text) - Logo display mode: 'default', 'image', 'text'
      - `primary_color` (text) - Primary brand color hex
      - `secondary_color` (text) - Secondary brand color hex
      - `accent_color` (text) - Accent brand color hex
      - `sidebar_bg` (text) - Sidebar background CSS (can be gradient)
      - `sidebar_text_color` (text) - Sidebar text color hex
      - `slide_bg` (text) - Presentation slide background CSS
      - `header_bg` (text) - Header background color hex
      - `font_family` (text) - Font family name
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `platform_branding` table
    - Add policy for anon users to read branding (public display data)
    - Add policy for authenticated users to update branding

  3. Notes
    - This table stores ONE global row of branding config, shared across all clients
    - Branding is separated from per-client customization so switching clients
      does not overwrite the platform's look and feel
    - Seeded with default branding values
*/

CREATE TABLE IF NOT EXISTS platform_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name text NOT NULL DEFAULT 'PrysmCS',
  logo_url text,
  logo_text text NOT NULL DEFAULT 'PrysmCS',
  logo_mode text NOT NULL DEFAULT 'default',
  primary_color text NOT NULL DEFAULT '#06b6d4',
  secondary_color text NOT NULL DEFAULT '#0f172a',
  accent_color text NOT NULL DEFAULT '#14b8a6',
  sidebar_bg text NOT NULL DEFAULT 'linear-gradient(180deg, #0a2540 0%, #0f172a 100%)',
  sidebar_text_color text NOT NULL DEFAULT '#e2e8f0',
  slide_bg text NOT NULL DEFAULT 'linear-gradient(135deg, #0a2540 0%, #0f172a 50%, #1e293b 100%)',
  header_bg text NOT NULL DEFAULT '#0f172a',
  font_family text NOT NULL DEFAULT 'Inter',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platform branding"
  ON platform_branding
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update platform branding"
  ON platform_branding
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can update platform branding"
  ON platform_branding
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can insert platform branding"
  ON platform_branding
  FOR INSERT
  TO anon
  WITH CHECK ((SELECT count(*) FROM platform_branding) < 1);

CREATE POLICY "Authenticated users can insert platform branding"
  ON platform_branding
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT count(*) FROM platform_branding) < 1);

INSERT INTO platform_branding (
  platform_name, logo_text, logo_mode,
  primary_color, secondary_color, accent_color,
  sidebar_bg, sidebar_text_color, slide_bg, header_bg, font_family
) VALUES (
  'PrysmCS', 'PrysmCS', 'default',
  '#06b6d4', '#0f172a', '#14b8a6',
  'linear-gradient(180deg, #0a2540 0%, #0f172a 100%)', '#e2e8f0',
  'linear-gradient(135deg, #0a2540 0%, #0f172a 50%, #1e293b 100%)', '#0f172a', 'Inter'
);