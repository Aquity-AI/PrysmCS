/*
  # Add Dashboard Management Tables

  1. New Tables
    - `widget_templates`
      - `id` (uuid, primary key)
      - `name` (text, template name)
      - `description` (text, optional description)
      - `widget_type` (text, type of widget)
      - `configuration` (jsonb, widget configuration including data_source and settings)
      - `category` (text, template category: ccm, enrollment, financial, outcomes, custom)
      - `is_system_template` (boolean, whether it's a built-in template)
      - `created_by` (text, client_id of creator, null for system templates)
      - `thumbnail_url` (text, optional preview image URL)
      - `usage_count` (integer, how many times used)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `page_layouts`
      - `id` (uuid, primary key)
      - `client_id` (text, references clients)
      - `page_id` (text, the dashboard page)
      - `layout_config` (jsonb, stores widgetPositions map and widgetOrder array for reflow system)
      - `grid_density` (text, compact/normal/spacious)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Table Modifications
    - Add grid positioning columns to `widget_configurations`
      - `grid_column` (integer, starting column 1-12)
      - `grid_row` (integer, row position)
      - `grid_width` (integer, columns span 1-12)
      - `grid_height` (integer, rows span)
      - `responsive_config` (jsonb, breakpoint-specific settings)

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated and anonymous users
*/

-- Create widget_templates table
CREATE TABLE IF NOT EXISTS widget_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  widget_type text NOT NULL,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  category text DEFAULT 'custom',
  is_system_template boolean DEFAULT false,
  created_by text,
  thumbnail_url text,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_widget_templates_category ON widget_templates(category);
CREATE INDEX IF NOT EXISTS idx_widget_templates_type ON widget_templates(widget_type);
CREATE INDEX IF NOT EXISTS idx_widget_templates_system ON widget_templates(is_system_template);
CREATE INDEX IF NOT EXISTS idx_widget_templates_created_by ON widget_templates(created_by);

-- Create page_layouts table
CREATE TABLE IF NOT EXISTS page_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  page_id text NOT NULL,
  layout_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  grid_density text DEFAULT 'normal',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, page_id)
);

CREATE INDEX IF NOT EXISTS idx_page_layouts_client ON page_layouts(client_id);
CREATE INDEX IF NOT EXISTS idx_page_layouts_page ON page_layouts(page_id);

-- Add grid positioning columns to widget_configurations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'widget_configurations' AND column_name = 'grid_column'
  ) THEN
    ALTER TABLE widget_configurations ADD COLUMN grid_column integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'widget_configurations' AND column_name = 'grid_row'
  ) THEN
    ALTER TABLE widget_configurations ADD COLUMN grid_row integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'widget_configurations' AND column_name = 'grid_width'
  ) THEN
    ALTER TABLE widget_configurations ADD COLUMN grid_width integer DEFAULT 6;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'widget_configurations' AND column_name = 'grid_height'
  ) THEN
    ALTER TABLE widget_configurations ADD COLUMN grid_height integer DEFAULT 4;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'widget_configurations' AND column_name = 'responsive_config'
  ) THEN
    ALTER TABLE widget_configurations ADD COLUMN responsive_config jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'widget_configurations' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE widget_configurations ADD COLUMN template_id uuid REFERENCES widget_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE widget_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_layouts ENABLE ROW LEVEL SECURITY;

-- Policies for widget_templates (authenticated users)
CREATE POLICY "Users can view system and own templates"
  ON widget_templates FOR SELECT
  TO authenticated
  USING (is_system_template = true OR auth.uid()::text = created_by);

CREATE POLICY "Users can insert own templates"
  ON widget_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = created_by AND is_system_template = false);

CREATE POLICY "Users can update own templates"
  ON widget_templates FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = created_by AND is_system_template = false)
  WITH CHECK (auth.uid()::text = created_by AND is_system_template = false);

CREATE POLICY "Users can delete own templates"
  ON widget_templates FOR DELETE
  TO authenticated
  USING (auth.uid()::text = created_by AND is_system_template = false);

-- Policies for page_layouts (authenticated users)
CREATE POLICY "Users can view own page layouts"
  ON page_layouts FOR SELECT
  TO authenticated
  USING (auth.uid()::text = client_id);

CREATE POLICY "Users can insert own page layouts"
  ON page_layouts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = client_id);

CREATE POLICY "Users can update own page layouts"
  ON page_layouts FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = client_id)
  WITH CHECK (auth.uid()::text = client_id);

CREATE POLICY "Users can delete own page layouts"
  ON page_layouts FOR DELETE
  TO authenticated
  USING (auth.uid()::text = client_id);

-- Anonymous policies for demo/development
CREATE POLICY "Allow anon users to view all templates"
  ON widget_templates FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon users to insert templates"
  ON widget_templates FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon users to update templates"
  ON widget_templates FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon users to delete templates"
  ON widget_templates FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow anon users to view all page layouts"
  ON page_layouts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon users to insert page layouts"
  ON page_layouts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon users to update page layouts"
  ON page_layouts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon users to delete page layouts"
  ON page_layouts FOR DELETE
  TO anon
  USING (true);

-- Insert default system templates
INSERT INTO widget_templates (name, description, widget_type, configuration, category, is_system_template) VALUES
  ('Enrollment Funnel', 'Visualize your contact-to-enrollment conversion pipeline', 'funnel-chart', '{"title": "Enrollment Funnel", "metrics": ["contacted", "enrolled"], "colors": ["#06b6d4", "#10b981"]}', 'enrollment', true),
  ('Monthly Revenue Trend', 'Track revenue performance over time', 'area-chart', '{"title": "Revenue Trend", "metrics": ["revenue"], "showGradient": true}', 'financial', true),
  ('Core KPI Dashboard', 'Four essential KPI cards for quick overview', 'kpi-card', '{"metrics": ["enrolledThisMonth", "activePatients", "servicesDelivered", "revenue"]}', 'ccm', true),
  ('Outcomes Gauge', 'Display key outcome metrics as gauges', 'gauge-chart', '{"title": "BP Improvement Rate", "metric": "bpImproved", "target": 80}', 'outcomes', true),
  ('Campaign Performance', 'Compare SMS, Email, and Mailer campaign results', 'bar-chart', '{"title": "Campaign Comparison", "metrics": ["smsSent", "emailSent", "mailersSent"]}', 'enrollment', true),
  ('Service Distribution', 'Pie chart showing service type breakdown', 'pie-chart', '{"title": "Service Distribution", "showLegend": true, "showPercentages": true}', 'ccm', true),
  ('Active Participants Trend', 'Line chart tracking active participant count', 'line-chart', '{"title": "Active Participants", "metrics": ["activePatients"], "showDataPoints": true}', 'ccm', true),
  ('Conversion Rate Gauge', 'Display enrollment conversion rate', 'gauge-chart', '{"title": "Conversion Rate", "calculated": true, "formula": "enrolled/contacted*100", "target": 25}', 'enrollment', true)
ON CONFLICT DO NOTHING;