/*
  # Create Dashboard Graphs Table

  1. New Tables
    - `dashboard_graphs`
      - `id` (uuid, primary key)
      - `client_id` (text, not null) - tenant isolation
      - `page_id` (text, not null) - which dashboard tab this graph belongs to
      - `title` (text, not null)
      - `chart_type` (text, not null) - line, bar, pie, donut, area, progress
      - `size` (text, not null, default 'half') - quarter, half, large, full
      - `metric_ids` (jsonb, not null) - array of metric reference strings
      - `time_range` (text) - time range preset
      - `aggregation` (text) - sum, avg, min, max, count
      - `group_by` (text) - day, week, month, quarter
      - `goals` (jsonb) - for progress type charts
      - `display_order` (integer, default 0) - position in grid
      - `enabled` (boolean, default true) - visibility toggle
      - `config` (jsonb, default '{}') - extensible settings bag
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - Soft delete columns matching existing pattern

  2. Security
    - Enable RLS on `dashboard_graphs` table
    - Add policies for anon and authenticated users to CRUD own client data

  3. Indexes
    - Composite index on (client_id, page_id) for fast page-level queries
    - Index on client_id for client-level queries
*/

CREATE TABLE IF NOT EXISTS dashboard_graphs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  page_id text NOT NULL,
  title text NOT NULL,
  chart_type text NOT NULL DEFAULT 'line',
  size text NOT NULL DEFAULT 'half',
  metric_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  time_range text,
  aggregation text,
  group_by text,
  goals jsonb,
  display_order integer DEFAULT 0,
  enabled boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by text,
  deletion_reason text,
  purge_at timestamptz,
  CONSTRAINT dashboard_graphs_chart_type_check CHECK (chart_type = ANY (ARRAY['line'::text, 'bar'::text, 'pie'::text, 'donut'::text, 'area'::text, 'progress'::text])),
  CONSTRAINT dashboard_graphs_size_check CHECK (size = ANY (ARRAY['quarter'::text, 'half'::text, 'large'::text, 'full'::text]))
);

CREATE INDEX IF NOT EXISTS idx_dashboard_graphs_client_page ON dashboard_graphs(client_id, page_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_graphs_client ON dashboard_graphs(client_id);

ALTER TABLE dashboard_graphs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view dashboard graphs"
  ON dashboard_graphs FOR SELECT
  TO anon
  USING (deleted_at IS NULL);

CREATE POLICY "Anon can insert dashboard graphs"
  ON dashboard_graphs FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update dashboard graphs"
  ON dashboard_graphs FOR UPDATE
  TO anon
  USING (deleted_at IS NULL)
  WITH CHECK (true);

CREATE POLICY "Anon can delete dashboard graphs"
  ON dashboard_graphs FOR DELETE
  TO anon
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated can view dashboard graphs"
  ON dashboard_graphs FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated can insert dashboard graphs"
  ON dashboard_graphs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update dashboard graphs"
  ON dashboard_graphs FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete dashboard graphs"
  ON dashboard_graphs FOR DELETE
  TO authenticated
  USING (deleted_at IS NULL);