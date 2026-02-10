/*
  # Fix Security and Performance Issues

  1. Foreign Key Indexes
    - Add index on `slide_backgrounds.gradient_id` for foreign key performance
    - Add index on `widget_configurations.template_id` for foreign key performance

  2. RLS Policy Optimization
    - Update all policies using `auth.uid()` to use `(select auth.uid())` pattern
    - This prevents re-evaluation of auth function for each row, improving performance
    - Tables affected: widget_configurations, custom_gradients, slide_backgrounds, 
      calculated_metrics, widget_templates, page_layouts

  3. Remove Unused Indexes
    - Drop idx_widget_configs_type (unused)
    - Drop idx_custom_gradients_client (unused)
    - Drop idx_custom_gradients_preset (unused)
    - Drop idx_slide_backgrounds_client (unused)
    - Drop idx_calculated_metrics_client (unused)
    - Drop idx_widget_templates_type (unused)
    - Drop idx_widget_templates_system (unused)
    - Drop idx_widget_templates_created_by (unused)
    - Drop idx_page_layouts_page (unused)

  4. Function Security
    - Fix initialize_default_widgets function to use immutable search_path
*/

-- ============================================================
-- 1. ADD FOREIGN KEY INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_slide_backgrounds_gradient_id 
ON slide_backgrounds(gradient_id);

CREATE INDEX IF NOT EXISTS idx_widget_configurations_template_id 
ON widget_configurations(template_id);

-- ============================================================
-- 2. FIX RLS POLICIES - widget_configurations
-- ============================================================

DROP POLICY IF EXISTS "Users can view own widget configurations" ON widget_configurations;
CREATE POLICY "Users can view own widget configurations"
  ON widget_configurations FOR SELECT
  TO authenticated
  USING (((select auth.uid())::text = client_id));

DROP POLICY IF EXISTS "Users can insert own widget configurations" ON widget_configurations;
CREATE POLICY "Users can insert own widget configurations"
  ON widget_configurations FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.uid())::text = client_id));

DROP POLICY IF EXISTS "Users can update own widget configurations" ON widget_configurations;
CREATE POLICY "Users can update own widget configurations"
  ON widget_configurations FOR UPDATE
  TO authenticated
  USING (((select auth.uid())::text = client_id))
  WITH CHECK (((select auth.uid())::text = client_id));

DROP POLICY IF EXISTS "Users can delete own widget configurations" ON widget_configurations;
CREATE POLICY "Users can delete own widget configurations"
  ON widget_configurations FOR DELETE
  TO authenticated
  USING (((select auth.uid())::text = client_id));

-- ============================================================
-- 2. FIX RLS POLICIES - custom_gradients
-- ============================================================

DROP POLICY IF EXISTS "Users can view own and preset gradients" ON custom_gradients;
CREATE POLICY "Users can view own and preset gradients"
  ON custom_gradients FOR SELECT
  TO authenticated
  USING ((is_preset = true) OR ((select auth.uid())::text = client_id));

DROP POLICY IF EXISTS "Users can insert own gradients" ON custom_gradients;
CREATE POLICY "Users can insert own gradients"
  ON custom_gradients FOR INSERT
  TO authenticated
  WITH CHECK ((((select auth.uid())::text = client_id) AND (is_preset = false)));

DROP POLICY IF EXISTS "Users can update own gradients" ON custom_gradients;
CREATE POLICY "Users can update own gradients"
  ON custom_gradients FOR UPDATE
  TO authenticated
  USING ((((select auth.uid())::text = client_id) AND (is_preset = false)))
  WITH CHECK ((((select auth.uid())::text = client_id) AND (is_preset = false)));

DROP POLICY IF EXISTS "Users can delete own gradients" ON custom_gradients;
CREATE POLICY "Users can delete own gradients"
  ON custom_gradients FOR DELETE
  TO authenticated
  USING ((((select auth.uid())::text = client_id) AND (is_preset = false)));

-- ============================================================
-- 2. FIX RLS POLICIES - slide_backgrounds
-- ============================================================

DROP POLICY IF EXISTS "Users can view own slide backgrounds" ON slide_backgrounds;
CREATE POLICY "Users can view own slide backgrounds"
  ON slide_backgrounds FOR SELECT
  TO authenticated
  USING (((select auth.uid())::text = client_id));

DROP POLICY IF EXISTS "Users can insert own slide backgrounds" ON slide_backgrounds;
CREATE POLICY "Users can insert own slide backgrounds"
  ON slide_backgrounds FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.uid())::text = client_id));

DROP POLICY IF EXISTS "Users can update own slide backgrounds" ON slide_backgrounds;
CREATE POLICY "Users can update own slide backgrounds"
  ON slide_backgrounds FOR UPDATE
  TO authenticated
  USING (((select auth.uid())::text = client_id))
  WITH CHECK (((select auth.uid())::text = client_id));

DROP POLICY IF EXISTS "Users can delete own slide backgrounds" ON slide_backgrounds;
CREATE POLICY "Users can delete own slide backgrounds"
  ON slide_backgrounds FOR DELETE
  TO authenticated
  USING (((select auth.uid())::text = client_id));

-- ============================================================
-- 2. FIX RLS POLICIES - calculated_metrics
-- ============================================================

DROP POLICY IF EXISTS "Users can view own calculated metrics" ON calculated_metrics;
CREATE POLICY "Users can view own calculated metrics"
  ON calculated_metrics FOR SELECT
  TO authenticated
  USING (((select auth.uid())::text = client_id));

DROP POLICY IF EXISTS "Users can insert own calculated metrics" ON calculated_metrics;
CREATE POLICY "Users can insert own calculated metrics"
  ON calculated_metrics FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.uid())::text = client_id));

DROP POLICY IF EXISTS "Users can update own calculated metrics" ON calculated_metrics;
CREATE POLICY "Users can update own calculated metrics"
  ON calculated_metrics FOR UPDATE
  TO authenticated
  USING (((select auth.uid())::text = client_id))
  WITH CHECK (((select auth.uid())::text = client_id));

DROP POLICY IF EXISTS "Users can delete own calculated metrics" ON calculated_metrics;
CREATE POLICY "Users can delete own calculated metrics"
  ON calculated_metrics FOR DELETE
  TO authenticated
  USING (((select auth.uid())::text = client_id));

-- ============================================================
-- 2. FIX RLS POLICIES - widget_templates
-- ============================================================

DROP POLICY IF EXISTS "Users can view system and own templates" ON widget_templates;
CREATE POLICY "Users can view system and own templates"
  ON widget_templates FOR SELECT
  TO authenticated
  USING ((is_system_template = true) OR ((select auth.uid())::text = created_by));

DROP POLICY IF EXISTS "Users can insert own templates" ON widget_templates;
CREATE POLICY "Users can insert own templates"
  ON widget_templates FOR INSERT
  TO authenticated
  WITH CHECK ((((select auth.uid())::text = created_by) AND (is_system_template = false)));

DROP POLICY IF EXISTS "Users can update own templates" ON widget_templates;
CREATE POLICY "Users can update own templates"
  ON widget_templates FOR UPDATE
  TO authenticated
  USING ((((select auth.uid())::text = created_by) AND (is_system_template = false)))
  WITH CHECK ((((select auth.uid())::text = created_by) AND (is_system_template = false)));

DROP POLICY IF EXISTS "Users can delete own templates" ON widget_templates;
CREATE POLICY "Users can delete own templates"
  ON widget_templates FOR DELETE
  TO authenticated
  USING ((((select auth.uid())::text = created_by) AND (is_system_template = false)));

-- ============================================================
-- 2. FIX RLS POLICIES - page_layouts
-- ============================================================

DROP POLICY IF EXISTS "Users can view own page layouts" ON page_layouts;
CREATE POLICY "Users can view own page layouts"
  ON page_layouts FOR SELECT
  TO authenticated
  USING (((select auth.uid())::text = client_id));

DROP POLICY IF EXISTS "Users can insert own page layouts" ON page_layouts;
CREATE POLICY "Users can insert own page layouts"
  ON page_layouts FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.uid())::text = client_id));

DROP POLICY IF EXISTS "Users can update own page layouts" ON page_layouts;
CREATE POLICY "Users can update own page layouts"
  ON page_layouts FOR UPDATE
  TO authenticated
  USING (((select auth.uid())::text = client_id))
  WITH CHECK (((select auth.uid())::text = client_id));

DROP POLICY IF EXISTS "Users can delete own page layouts" ON page_layouts;
CREATE POLICY "Users can delete own page layouts"
  ON page_layouts FOR DELETE
  TO authenticated
  USING (((select auth.uid())::text = client_id));

-- ============================================================
-- 3. DROP UNUSED INDEXES
-- ============================================================

DROP INDEX IF EXISTS idx_widget_configs_type;
DROP INDEX IF EXISTS idx_custom_gradients_client;
DROP INDEX IF EXISTS idx_custom_gradients_preset;
DROP INDEX IF EXISTS idx_slide_backgrounds_client;
DROP INDEX IF EXISTS idx_calculated_metrics_client;
DROP INDEX IF EXISTS idx_widget_templates_type;
DROP INDEX IF EXISTS idx_widget_templates_system;
DROP INDEX IF EXISTS idx_widget_templates_created_by;
DROP INDEX IF EXISTS idx_page_layouts_page;

-- ============================================================
-- 4. FIX FUNCTION SEARCH PATH
-- ============================================================

CREATE OR REPLACE FUNCTION public.initialize_default_widgets(p_client_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO widget_configurations (
    client_id, page_id, widget_id, widget_type, title, description,
    grid_column, grid_row, grid_width, grid_height, enabled, "order",
    data_source, settings
  ) VALUES
  (p_client_id, 'overview', 'kpi-enrolled', 'kpi-card', 'Participants Enrolled This Month', 'Key metric from core schema',
   1, 1, 3, 2, true, 1,
   '{"schemaField": "enrolledThisMonth", "category": "core-metrics"}'::jsonb, '{}'::jsonb),
  (p_client_id, 'overview', 'kpi-active', 'kpi-card', 'Total Active Participants', 'Key metric from core schema',
   4, 1, 3, 2, true, 2,
   '{"schemaField": "activePatients", "category": "core-metrics"}'::jsonb, '{}'::jsonb),
  (p_client_id, 'overview', 'kpi-services', 'kpi-card', 'Services Delivered', 'Key metric from core schema',
   7, 1, 3, 2, true, 3,
   '{"schemaField": "servicesDelivered", "category": "core-metrics"}'::jsonb, '{}'::jsonb),
  (p_client_id, 'overview', 'kpi-revenue', 'kpi-card', 'Revenue This Month', 'Key metric from core schema',
   10, 1, 3, 2, true, 4,
   '{"schemaField": "revenue", "category": "core-metrics"}'::jsonb, '{}'::jsonb),
  (p_client_id, 'overview', 'enrollment-trend', 'area-chart', 'Enrollment Trend', 'Monthly enrollments over time',
   1, 3, 6, 4, true, 5,
   '{"metric": "enrolledThisMonth"}'::jsonb, '{"showGradient": true}'::jsonb),
  (p_client_id, 'overview', 'active-participants', 'area-chart', 'Active Participants', 'Total active participants over time',
   7, 3, 6, 4, true, 6,
   '{"metric": "activePatients"}'::jsonb, '{"showGradient": true}'::jsonb),
  (p_client_id, 'overview', 'monthly-summary', 'summary-card', 'Monthly Progress Summary', 'Enrollment, retention, and revenue summary',
   1, 7, 12, 3, true, 7,
   '{}'::jsonb, '{}'::jsonb)
  ON CONFLICT (client_id, page_id, widget_id) DO NOTHING;

  INSERT INTO widget_configurations (
    client_id, page_id, widget_id, widget_type, title, description,
    grid_column, grid_row, grid_width, grid_height, enabled, "order",
    data_source, settings
  ) VALUES
  (p_client_id, 'enrollment', 'enrollment-funnel', 'funnel-chart', 'Enrollment Funnel', 'Conversion rates at each stage',
   1, 1, 12, 4, true, 1,
   '{"schemaFields": ["contacted", "screened", "eligible", "enrolled"]}'::jsonb, '{}'::jsonb),
  (p_client_id, 'enrollment', 'sms-campaign', 'campaign-card', 'SMS Campaign', 'SMS campaign performance metrics',
   1, 5, 4, 3, true, 2,
   '{"schemaFields": ["smsSent", "smsResponded"], "category": "campaigns"}'::jsonb, '{"campaignType": "sms"}'::jsonb),
  (p_client_id, 'enrollment', 'email-campaign', 'campaign-card', 'Email Campaign', 'Email campaign performance metrics',
   5, 5, 4, 3, true, 3,
   '{"schemaFields": ["emailSent", "emailOpened"], "category": "campaigns"}'::jsonb, '{"campaignType": "email"}'::jsonb),
  (p_client_id, 'enrollment', 'mailer-campaign', 'campaign-card', 'Mailer Campaign', 'Direct mail campaign performance metrics',
   9, 5, 4, 3, true, 4,
   '{"schemaFields": ["mailersSent", "mailersResponded"], "category": "campaigns"}'::jsonb, '{"campaignType": "mailer"}'::jsonb)
  ON CONFLICT (client_id, page_id, widget_id) DO NOTHING;

  INSERT INTO widget_configurations (
    client_id, page_id, widget_id, widget_type, title, description,
    grid_column, grid_row, grid_width, grid_height, enabled, "order",
    data_source, settings
  ) VALUES
  (p_client_id, 'financial', 'revenue-breakdown', 'bar-chart', 'Revenue Breakdown', 'Monthly revenue by category',
   1, 3, 6, 4, true, 1,
   '{"schemaField": "revenue"}'::jsonb, '{"showLegend": true}'::jsonb),
  (p_client_id, 'financial', 'cost-analysis', 'pie-chart', 'Cost Analysis', 'Cost distribution breakdown',
   7, 3, 6, 4, true, 2,
   '{}'::jsonb, '{"showLegend": true, "showPercentages": true}'::jsonb)
  ON CONFLICT (client_id, page_id, widget_id) DO NOTHING;

  INSERT INTO widget_configurations (
    client_id, page_id, widget_id, widget_type, title, description,
    grid_column, grid_row, grid_width, grid_height, enabled, "order",
    data_source, settings
  ) VALUES
  (p_client_id, 'outcomes', 'bp-improvement', 'gauge-chart', 'Blood Pressure Control', 'Percentage of patients with improved BP',
   1, 3, 4, 3, true, 1,
   '{"schemaField": "bpImproved"}'::jsonb, '{"target": 80, "unit": "%"}'::jsonb),
  (p_client_id, 'outcomes', 'a1c-improvement', 'gauge-chart', 'A1C Control', 'Percentage of patients with improved A1C',
   5, 3, 4, 3, true, 2,
   '{"schemaField": "a1cImproved"}'::jsonb, '{"target": 75, "unit": "%"}'::jsonb),
  (p_client_id, 'outcomes', 'weight-improvement', 'gauge-chart', 'Weight Management', 'Percentage of patients with weight improvement',
   9, 3, 4, 3, true, 3,
   '{"schemaField": "weightImproved"}'::jsonb, '{"target": 70, "unit": "%"}'::jsonb)
  ON CONFLICT (client_id, page_id, widget_id) DO NOTHING;
END;
$$;