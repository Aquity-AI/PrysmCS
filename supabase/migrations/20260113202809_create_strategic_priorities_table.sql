/*
  # Create Strategic Priorities Table

  1. New Tables
    - `strategic_priorities`
      - `id` (uuid, primary key) - Unique identifier
      - `client_id` (text) - Links to client
      - `icon` (text) - Lucide icon name (e.g., "Pill", "Smartphone")
      - `title` (text) - Card heading (e.g., "Chronic Care Management (CCM)")
      - `subtitle` (text) - Card description
      - `focus_areas` (jsonb) - Array of focus area bullet points
      - `is_visible` (boolean) - Controls visibility on Client Facing tab
      - `show_in_data_management` (boolean) - Display in Data Management tab
      - `display_order` (integer) - Custom ordering
      - `month_association` (text) - Optional format "YYYY-MM" for monthly tracking
      - `created_at` (timestamptz) - Auto-generated timestamp
      - `updated_at` (timestamptz) - Auto-updated timestamp

  2. Security
    - Enable RLS on `strategic_priorities` table
    - Add policies for authenticated and anonymous users (full access)

  3. Performance
    - Add indexes on client_id, is_visible, show_in_data_management, display_order

  4. Triggers
    - Add updated_at trigger to automatically update timestamp on changes
*/

-- Create the strategic_priorities table
CREATE TABLE IF NOT EXISTS strategic_priorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  icon text DEFAULT 'Lightbulb',
  title text NOT NULL,
  subtitle text DEFAULT '',
  focus_areas jsonb DEFAULT '[]'::jsonb,
  is_visible boolean DEFAULT true,
  show_in_data_management boolean DEFAULT true,
  display_order integer DEFAULT 0,
  month_association text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE strategic_priorities ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view all strategic priorities"
  ON strategic_priorities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert strategic priorities"
  ON strategic_priorities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update strategic priorities"
  ON strategic_priorities
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete strategic priorities"
  ON strategic_priorities
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for anonymous users (for client-facing view)
CREATE POLICY "Anonymous users can view visible strategic priorities"
  ON strategic_priorities
  FOR SELECT
  TO anon
  USING (is_visible = true);

CREATE POLICY "Anonymous users can insert strategic priorities"
  ON strategic_priorities
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update strategic priorities"
  ON strategic_priorities
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete strategic priorities"
  ON strategic_priorities
  FOR DELETE
  TO anon
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_strategic_priorities_client_id 
  ON strategic_priorities(client_id);

CREATE INDEX IF NOT EXISTS idx_strategic_priorities_is_visible 
  ON strategic_priorities(is_visible);

CREATE INDEX IF NOT EXISTS idx_strategic_priorities_show_in_data_management 
  ON strategic_priorities(show_in_data_management);

CREATE INDEX IF NOT EXISTS idx_strategic_priorities_display_order 
  ON strategic_priorities(display_order);

CREATE INDEX IF NOT EXISTS idx_strategic_priorities_month_association 
  ON strategic_priorities(month_association);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_strategic_priorities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_strategic_priorities_updated_at ON strategic_priorities;
CREATE TRIGGER trigger_update_strategic_priorities_updated_at
  BEFORE UPDATE ON strategic_priorities
  FOR EACH ROW
  EXECUTE FUNCTION update_strategic_priorities_updated_at();
