/*
  # Add Anonymous Access Policies for Time Series Metrics

  1. Purpose
    - Enable anonymous users to fully manage metrics and charts
    - Fix RLS policy issues preventing metric creation from UI
    - Maintain security while allowing demo/prototype functionality

  2. Security Changes
    - Add INSERT policies for anonymous users on:
      - metric_definitions
      - historical_metric_data
      - chart_sections
      - chart_metrics
    - Add UPDATE policies for anonymous users on:
      - metric_definitions
      - historical_metric_data
      - chart_sections
      - chart_metrics
    - Add DELETE policies for anonymous users on:
      - metric_definitions
      - historical_metric_data
      - chart_sections
      - chart_metrics

  3. Notes
    - Anonymous SELECT policies already exist for these tables
    - metric_tracking_config intentionally remains auth-only
    - Follows same pattern as other anonymous policy migrations
*/

-- ============================================================================
-- RLS POLICIES: Metric Definitions (Anonymous Access)
-- ============================================================================

CREATE POLICY "Allow anonymous insert metric definitions"
  ON metric_definitions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update metric definitions"
  ON metric_definitions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete metric definitions"
  ON metric_definitions FOR DELETE
  TO anon
  USING (true);

-- ============================================================================
-- RLS POLICIES: Historical Metric Data (Anonymous Access)
-- ============================================================================

CREATE POLICY "Allow anonymous insert historical data"
  ON historical_metric_data FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update historical data"
  ON historical_metric_data FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete historical data"
  ON historical_metric_data FOR DELETE
  TO anon
  USING (true);

-- ============================================================================
-- RLS POLICIES: Chart Sections (Anonymous Access)
-- ============================================================================

CREATE POLICY "Allow anonymous insert chart sections"
  ON chart_sections FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update chart sections"
  ON chart_sections FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete chart sections"
  ON chart_sections FOR DELETE
  TO anon
  USING (true);

-- ============================================================================
-- RLS POLICIES: Chart Metrics (Anonymous Access)
-- ============================================================================

CREATE POLICY "Allow anonymous insert chart metrics"
  ON chart_metrics FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update chart metrics"
  ON chart_metrics FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete chart metrics"
  ON chart_metrics FOR DELETE
  TO anon
  USING (true);
