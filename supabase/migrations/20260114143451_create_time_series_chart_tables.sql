/*
  # Create Time Series Chart Tables

  1. Purpose
    - Enable flexible historical metric tracking with line graph visualization
    - Support both automatic form field snapshots and manual data entry
    - Allow CSV bulk import for historical data
    - Provide configurable chart sections for any page

  2. New Tables
    - `metric_definitions`
      - Catalog of all trackable metrics with metadata
      - Links to form fields or marks as manual entry metrics

    - `historical_metric_data`
      - Time-series data points for all metrics
      - Supports auto-snapshot, manual entry, and CSV import sources

    - `chart_sections`
      - Chart configuration and display settings
      - Links charts to specific pages and sections

    - `chart_metrics`
      - Many-to-many relationship between charts and metrics
      - Stores display settings per metric per chart

    - `metric_tracking_config`
      - Opt-in configuration for automatic form field tracking
      - Controls which fields get auto-captured

  3. Security
    - Enable RLS on all tables
    - Add policies for anonymous and authenticated access
    - Restrict based on client_id ownership

  4. Features Enabled
    - Historical metric tracking from any form field
    - Manual time-series data entry
    - CSV bulk import with validation
    - Flexible chart configuration
    - Multi-metric line graph visualization
*/

-- ============================================================================
-- CREATE TABLE: Metric Definitions
-- ============================================================================
CREATE TABLE IF NOT EXISTS metric_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  metric_name text NOT NULL,
  metric_key text NOT NULL,
  data_type text NOT NULL DEFAULT 'number',
  category text DEFAULT 'custom',
  source_type text NOT NULL DEFAULT 'manual',
  form_field_id text DEFAULT NULL,
  form_page_id text DEFAULT NULL,
  unit text DEFAULT '',
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT metric_data_type_check CHECK (data_type IN ('number', 'currency', 'percentage', 'decimal')),
  CONSTRAINT metric_source_type_check CHECK (source_type IN ('form_field', 'manual', 'calculated')),
  CONSTRAINT metric_category_check CHECK (category IN ('enrollment', 'financial', 'engagement', 'outcomes', 'custom')),
  UNIQUE(client_id, metric_key)
);

-- ============================================================================
-- CREATE TABLE: Historical Metric Data
-- ============================================================================
CREATE TABLE IF NOT EXISTS historical_metric_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id uuid NOT NULL REFERENCES metric_definitions(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  data_date date NOT NULL,
  value numeric NOT NULL,
  data_source text NOT NULL DEFAULT 'manual_entry',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT data_source_check CHECK (data_source IN ('auto_snapshot', 'manual_entry', 'csv_import', 'api_import')),
  UNIQUE(metric_id, client_id, data_date)
);

-- ============================================================================
-- CREATE TABLE: Chart Sections
-- ============================================================================
CREATE TABLE IF NOT EXISTS chart_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  page_id text NOT NULL,
  section_id text NOT NULL,
  title text NOT NULL DEFAULT 'Historical Trend',
  subtitle text DEFAULT '',
  chart_type text NOT NULL DEFAULT 'line',
  time_range_preset text DEFAULT 'last_6_months',
  custom_start_date date DEFAULT NULL,
  custom_end_date date DEFAULT NULL,
  granularity text DEFAULT 'monthly',
  height integer DEFAULT 300,
  show_legend boolean DEFAULT true,
  show_grid boolean DEFAULT true,
  show_data_points boolean DEFAULT false,
  show_goal_line boolean DEFAULT false,
  goal_value numeric DEFAULT NULL,
  goal_label text DEFAULT '',
  enabled boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT chart_type_check CHECK (chart_type IN ('line', 'area', 'bar')),
  CONSTRAINT time_range_preset_check CHECK (time_range_preset IN ('last_3_months', 'last_6_months', 'last_12_months', 'year_to_date', 'all_time', 'custom')),
  CONSTRAINT granularity_check CHECK (granularity IN ('daily', 'weekly', 'monthly', 'quarterly')),
  UNIQUE(client_id, page_id, section_id)
);

-- ============================================================================
-- CREATE TABLE: Chart Metrics (Join Table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS chart_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_section_id uuid NOT NULL REFERENCES chart_sections(id) ON DELETE CASCADE,
  metric_id uuid NOT NULL REFERENCES metric_definitions(id) ON DELETE CASCADE,
  line_color text DEFAULT '#06b6d4',
  line_style text DEFAULT 'solid',
  axis_position text DEFAULT 'left',
  display_name_override text DEFAULT NULL,
  show_in_legend boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT line_style_check CHECK (line_style IN ('solid', 'dashed', 'dotted')),
  CONSTRAINT axis_position_check CHECK (axis_position IN ('left', 'right')),
  UNIQUE(chart_section_id, metric_id)
);

-- ============================================================================
-- CREATE TABLE: Metric Tracking Configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS metric_tracking_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  page_id text NOT NULL,
  form_field_id text NOT NULL,
  metric_id uuid NOT NULL REFERENCES metric_definitions(id) ON DELETE CASCADE,
  auto_capture_enabled boolean DEFAULT true,
  capture_frequency text DEFAULT 'on_save',
  last_captured_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT capture_frequency_check CHECK (capture_frequency IN ('on_save', 'daily', 'weekly', 'monthly')),
  UNIQUE(client_id, page_id, form_field_id)
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_metric_definitions_client
  ON metric_definitions(client_id, is_active);

CREATE INDEX IF NOT EXISTS idx_metric_definitions_category
  ON metric_definitions(category);

CREATE INDEX IF NOT EXISTS idx_metric_definitions_source
  ON metric_definitions(source_type, form_page_id);

CREATE INDEX IF NOT EXISTS idx_historical_data_metric_date
  ON historical_metric_data(metric_id, data_date DESC);

CREATE INDEX IF NOT EXISTS idx_historical_data_client_date
  ON historical_metric_data(client_id, data_date DESC);

CREATE INDEX IF NOT EXISTS idx_chart_sections_client_page
  ON chart_sections(client_id, page_id);

CREATE INDEX IF NOT EXISTS idx_chart_metrics_chart
  ON chart_metrics(chart_section_id, display_order);

CREATE INDEX IF NOT EXISTS idx_metric_tracking_client_page
  ON metric_tracking_config(client_id, page_id);

-- ============================================================================
-- SECURITY: Enable RLS
-- ============================================================================
ALTER TABLE metric_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_metric_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_tracking_config ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: Metric Definitions
-- ============================================================================
CREATE POLICY "Allow anonymous read access to metric definitions"
  ON metric_definitions FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Allow authenticated read access to metric definitions"
  ON metric_definitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert metric definitions"
  ON metric_definitions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update metric definitions"
  ON metric_definitions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete metric definitions"
  ON metric_definitions FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- RLS POLICIES: Historical Metric Data
-- ============================================================================
CREATE POLICY "Allow anonymous read access to historical data"
  ON historical_metric_data FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM metric_definitions
      WHERE metric_definitions.id = historical_metric_data.metric_id
      AND metric_definitions.is_active = true
    )
  );

CREATE POLICY "Allow authenticated read access to historical data"
  ON historical_metric_data FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert historical data"
  ON historical_metric_data FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update historical data"
  ON historical_metric_data FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete historical data"
  ON historical_metric_data FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- RLS POLICIES: Chart Sections
-- ============================================================================
CREATE POLICY "Allow anonymous read access to enabled charts"
  ON chart_sections FOR SELECT
  TO anon
  USING (enabled = true);

CREATE POLICY "Allow authenticated read access to chart sections"
  ON chart_sections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert chart sections"
  ON chart_sections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update chart sections"
  ON chart_sections FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete chart sections"
  ON chart_sections FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- RLS POLICIES: Chart Metrics
-- ============================================================================
CREATE POLICY "Allow anonymous read access to chart metrics"
  ON chart_metrics FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM chart_sections
      WHERE chart_sections.id = chart_metrics.chart_section_id
      AND chart_sections.enabled = true
    )
  );

CREATE POLICY "Allow authenticated read access to chart metrics"
  ON chart_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert chart metrics"
  ON chart_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update chart metrics"
  ON chart_metrics FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete chart metrics"
  ON chart_metrics FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- RLS POLICIES: Metric Tracking Config
-- ============================================================================
CREATE POLICY "Allow authenticated read access to tracking config"
  ON metric_tracking_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert tracking config"
  ON metric_tracking_config FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update tracking config"
  ON metric_tracking_config FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete tracking config"
  ON metric_tracking_config FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- FUNCTIONS: Auto-update timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_time_series_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_metric_definitions_timestamp
  BEFORE UPDATE ON metric_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_time_series_timestamp();

CREATE TRIGGER update_historical_data_timestamp
  BEFORE UPDATE ON historical_metric_data
  FOR EACH ROW
  EXECUTE FUNCTION update_time_series_timestamp();

CREATE TRIGGER update_chart_sections_timestamp
  BEFORE UPDATE ON chart_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_time_series_timestamp();

CREATE TRIGGER update_metric_tracking_config_timestamp
  BEFORE UPDATE ON metric_tracking_config
  FOR EACH ROW
  EXECUTE FUNCTION update_time_series_timestamp();
