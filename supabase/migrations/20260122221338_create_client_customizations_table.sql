/*
  # Create Client Customizations Table
  
  This table stores per-client customization data including:
  - Form field configurations (icons, labels, visibility)
  - Section configurations
  - Tab visibility settings
  - Any other client-specific UI customizations

  1. New Tables
    - `client_customizations`
      - `id` (uuid, primary key) - Unique identifier for the record
      - `client_id` (text, unique, not null) - The client identifier this customization belongs to
      - `customization_data` (jsonb, not null) - JSON object containing all customization settings
      - `created_at` (timestamptz) - When the record was created
      - `updated_at` (timestamptz) - When the record was last updated

  2. Security
    - Enable RLS on `client_customizations` table
    - Add policy for anonymous users to select/insert/update (demo mode support)
    
  3. Indexes
    - Unique index on client_id for fast lookups
*/

-- Create the client_customizations table
CREATE TABLE IF NOT EXISTS client_customizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text UNIQUE NOT NULL,
  customization_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE client_customizations ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (demo mode)
CREATE POLICY "Allow anonymous select on client_customizations"
  ON client_customizations
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on client_customizations"
  ON client_customizations
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on client_customizations"
  ON client_customizations
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_customizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at on changes
DROP TRIGGER IF EXISTS trigger_update_client_customizations_updated_at ON client_customizations;
CREATE TRIGGER trigger_update_client_customizations_updated_at
  BEFORE UPDATE ON client_customizations
  FOR EACH ROW
  EXECUTE FUNCTION update_client_customizations_updated_at();
