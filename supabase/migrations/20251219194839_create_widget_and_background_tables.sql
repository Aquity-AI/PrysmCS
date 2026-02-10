/*
  # Create Widget Configurations and Custom Backgrounds Tables

  1. New Tables
    - `widget_configurations`
      - `id` (uuid, primary key)
      - `client_id` (text, references clients)
      - `page_id` (text, the page/tab where widget appears)
      - `widget_id` (text, unique identifier for the widget instance)
      - `widget_type` (text, type of widget: pie-chart, donut-chart, gauge, etc.)
      - `title` (text, custom title for the widget)
      - `description` (text, optional description)
      - `data_source` (jsonb, configuration for data source and metrics)
      - `settings` (jsonb, widget-specific configuration)
      - `position` (jsonb, layout position and size)
      - `enabled` (boolean, whether widget is visible)
      - `order` (integer, display order on page)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `custom_gradients`
      - `id` (uuid, primary key)
      - `client_id` (text, references clients, optional for global presets)
      - `name` (text, user-friendly name)
      - `gradient_type` (text, linear, radial, or conic)
      - `colors` (jsonb, array of color stops)
      - `angle` (integer, gradient angle in degrees)
      - `is_preset` (boolean, whether it's a global preset)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `slide_backgrounds`
      - `id` (uuid, primary key)
      - `client_id` (text, references clients)
      - `slide_id` (text, identifier for the slide)
      - `background_type` (text, gradient, solid, or image)
      - `background_value` (text, CSS value or image URL)
      - `gradient_id` (uuid, references custom_gradients, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `calculated_metrics`
      - `id` (uuid, primary key)
      - `client_id` (text, references clients)
      - `metric_id` (text, unique identifier)
      - `name` (text, display name)
      - `formula` (text, calculation formula)
      - `source_metrics` (jsonb, array of metrics used in formula)
      - `format` (text, number, currency, percentage)
      - `description` (text, what the metric represents)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own configurations
    - Add policies for reading global presets
*/

-- Create widget_configurations table
CREATE TABLE IF NOT EXISTS widget_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  page_id text NOT NULL,
  widget_id text NOT NULL,
  widget_type text NOT NULL,
  title text,
  description text,
  data_source jsonb DEFAULT '{}'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  position jsonb DEFAULT '{"x": 0, "y": 0, "width": 6, "height": 4}'::jsonb,
  enabled boolean DEFAULT true,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, page_id, widget_id)
);

CREATE INDEX IF NOT EXISTS idx_widget_configs_client_page ON widget_configurations(client_id, page_id);
CREATE INDEX IF NOT EXISTS idx_widget_configs_type ON widget_configurations(widget_type);

-- Create custom_gradients table
CREATE TABLE IF NOT EXISTS custom_gradients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text,
  name text NOT NULL,
  gradient_type text DEFAULT 'linear',
  colors jsonb NOT NULL,
  angle integer DEFAULT 135,
  is_preset boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_gradients_client ON custom_gradients(client_id);
CREATE INDEX IF NOT EXISTS idx_custom_gradients_preset ON custom_gradients(is_preset);

-- Create slide_backgrounds table
CREATE TABLE IF NOT EXISTS slide_backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  slide_id text NOT NULL,
  background_type text DEFAULT 'gradient',
  background_value text,
  gradient_id uuid REFERENCES custom_gradients(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, slide_id)
);

CREATE INDEX IF NOT EXISTS idx_slide_backgrounds_client ON slide_backgrounds(client_id);

-- Create calculated_metrics table
CREATE TABLE IF NOT EXISTS calculated_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  metric_id text NOT NULL,
  name text NOT NULL,
  formula text NOT NULL,
  source_metrics jsonb DEFAULT '[]'::jsonb,
  format text DEFAULT 'number',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, metric_id)
);

CREATE INDEX IF NOT EXISTS idx_calculated_metrics_client ON calculated_metrics(client_id);

-- Enable RLS on all tables
ALTER TABLE widget_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_gradients ENABLE ROW LEVEL SECURITY;
ALTER TABLE slide_backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculated_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for widget_configurations
CREATE POLICY "Users can view own widget configurations"
  ON widget_configurations FOR SELECT
  TO authenticated
  USING (auth.uid()::text = client_id);

CREATE POLICY "Users can insert own widget configurations"
  ON widget_configurations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = client_id);

CREATE POLICY "Users can update own widget configurations"
  ON widget_configurations FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = client_id)
  WITH CHECK (auth.uid()::text = client_id);

CREATE POLICY "Users can delete own widget configurations"
  ON widget_configurations FOR DELETE
  TO authenticated
  USING (auth.uid()::text = client_id);

-- Policies for custom_gradients
CREATE POLICY "Users can view own and preset gradients"
  ON custom_gradients FOR SELECT
  TO authenticated
  USING (is_preset = true OR auth.uid()::text = client_id);

CREATE POLICY "Users can insert own gradients"
  ON custom_gradients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = client_id AND is_preset = false);

CREATE POLICY "Users can update own gradients"
  ON custom_gradients FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = client_id AND is_preset = false)
  WITH CHECK (auth.uid()::text = client_id AND is_preset = false);

CREATE POLICY "Users can delete own gradients"
  ON custom_gradients FOR DELETE
  TO authenticated
  USING (auth.uid()::text = client_id AND is_preset = false);

-- Policies for slide_backgrounds
CREATE POLICY "Users can view own slide backgrounds"
  ON slide_backgrounds FOR SELECT
  TO authenticated
  USING (auth.uid()::text = client_id);

CREATE POLICY "Users can insert own slide backgrounds"
  ON slide_backgrounds FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = client_id);

CREATE POLICY "Users can update own slide backgrounds"
  ON slide_backgrounds FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = client_id)
  WITH CHECK (auth.uid()::text = client_id);

CREATE POLICY "Users can delete own slide backgrounds"
  ON slide_backgrounds FOR DELETE
  TO authenticated
  USING (auth.uid()::text = client_id);

-- Policies for calculated_metrics
CREATE POLICY "Users can view own calculated metrics"
  ON calculated_metrics FOR SELECT
  TO authenticated
  USING (auth.uid()::text = client_id);

CREATE POLICY "Users can insert own calculated metrics"
  ON calculated_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = client_id);

CREATE POLICY "Users can update own calculated metrics"
  ON calculated_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = client_id)
  WITH CHECK (auth.uid()::text = client_id);

CREATE POLICY "Users can delete own calculated metrics"
  ON calculated_metrics FOR DELETE
  TO authenticated
  USING (auth.uid()::text = client_id);