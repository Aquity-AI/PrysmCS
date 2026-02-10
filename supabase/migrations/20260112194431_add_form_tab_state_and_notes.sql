/*
  # Add Form Tab State and Notes Support

  1. New Tables
    - `form_tab_state`
      - Stores user's last active tab per client dashboard
      - `id` (uuid, primary key)
      - `client_id` (text, references dashboard)
      - `last_active_tab` (text, tab identifier)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `form_notes`
      - Stores monthly context and narrative notes
      - `id` (uuid, primary key)
      - `client_id` (text)
      - `month` (text, format YYYY-MM)
      - `monthly_highlights` (text)
      - `challenges` (text)
      - `action_items` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `section_preferences`
      - Stores user preferences for expanded/collapsed sections
      - `id` (uuid, primary key)
      - `client_id` (text)
      - `section_id` (text)
      - `is_expanded` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for anonymous access (matching existing pattern)
*/

-- Create form_tab_state table
CREATE TABLE IF NOT EXISTS form_tab_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  last_active_tab text NOT NULL DEFAULT 'overview',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id)
);

ALTER TABLE form_tab_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to form_tab_state"
  ON form_tab_state FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on form_tab_state"
  ON form_tab_state FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on form_tab_state"
  ON form_tab_state FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on form_tab_state"
  ON form_tab_state FOR DELETE
  TO anon
  USING (true);

-- Create form_notes table
CREATE TABLE IF NOT EXISTS form_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  month text NOT NULL,
  monthly_highlights text DEFAULT '',
  challenges text DEFAULT '',
  action_items text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, month)
);

ALTER TABLE form_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to form_notes"
  ON form_notes FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on form_notes"
  ON form_notes FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on form_notes"
  ON form_notes FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on form_notes"
  ON form_notes FOR DELETE
  TO anon
  USING (true);

-- Create section_preferences table
CREATE TABLE IF NOT EXISTS section_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  section_id text NOT NULL,
  is_expanded boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, section_id)
);

ALTER TABLE section_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to section_preferences"
  ON section_preferences FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert on section_preferences"
  ON section_preferences FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on section_preferences"
  ON section_preferences FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on section_preferences"
  ON section_preferences FOR DELETE
  TO anon
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_form_tab_state_client_id ON form_tab_state(client_id);
CREATE INDEX IF NOT EXISTS idx_form_notes_client_month ON form_notes(client_id, month);
CREATE INDEX IF NOT EXISTS idx_section_preferences_client_section ON section_preferences(client_id, section_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_form_tab_state_updated_at'
  ) THEN
    CREATE TRIGGER update_form_tab_state_updated_at
      BEFORE UPDATE ON form_tab_state
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_form_notes_updated_at'
  ) THEN
    CREATE TRIGGER update_form_notes_updated_at
      BEFORE UPDATE ON form_notes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_section_preferences_updated_at'
  ) THEN
    CREATE TRIGGER update_section_preferences_updated_at
      BEFORE UPDATE ON section_preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;